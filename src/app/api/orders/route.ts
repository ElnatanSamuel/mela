import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, tables, transactions, tableAssignments, hotels, orderItems, menuItems } from "@/db/schema";
import { eq, desc, sql, inArray, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "mela-kitchen-secret-key-2024");

async function getKitchenSession(req: Request): Promise<{ hotelId: string } | null> {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...val] = c.trim().split("=");
        return [key, val.join("=")];
      })
    );
    const token = cookies["kitchen-session"];
    if (!token) return null;
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { hotelId: payload.hotelId as string };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const queryHotelId = searchParams.get("hotelId");
  const activeOnly = searchParams.get("active") === "true";

  // Try Supabase auth first, then kitchen-session
  let hotelId: string | null = null;
  let userRole: string | null = null;
  let userId: string | null = null;

  const roleInfo = await getUserRole();
  if (roleInfo?.hotelId) {
    hotelId = queryHotelId || roleInfo.hotelId;
    userRole = roleInfo.role;
    userId = roleInfo.userId;
  } else {
    const kitchenSession = await getKitchenSession(req);
    if (kitchenSession) {
      hotelId = queryHotelId || kitchenSession.hotelId;
      userRole = "kitchen";
    }
  }

  if (!hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isWaiter = userRole === "waiter";

  // Check hotel settings for table assignment
  const [hotel] = await db
    .select({ settings: hotels.settings })
    .from(hotels)
    .where(eq(hotels.id, hotelId))
    .limit(1);

  const settings = (hotel?.settings as any) || {};
  const assignmentEnabled = settings.enableTableAssignment === true;

  let tableIds: string[] | null = null;

  // If waiter and table assignment is enabled, get assigned table IDs
  if (isWaiter && assignmentEnabled && userId) {
    const assignments = await db
      .select({ tableId: tableAssignments.tableId })
      .from(tableAssignments)
      .where(eq(tableAssignments.userId, userId));

    tableIds = assignments.map((a) => a.tableId);

    // If no tables assigned, return empty
    if (tableIds.length === 0) {
      return NextResponse.json([]);
    }
  }

  const whereClause = tableIds
    ? and(
        eq(orders.hotelId, hotelId),
        sql`${orders.tableId} IN ${tableIds}`,
        activeOnly ? sql`${orders.status} IN ('pending', 'confirmed', 'preparing', 'served')` : undefined
      )
    : and(
        eq(orders.hotelId, hotelId),
        activeOnly ? sql`${orders.status} IN ('pending', 'confirmed', 'preparing', 'served')` : undefined
      );

  const activeOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      payment_status: orders.paymentStatus,
      order_type: orders.orderType,
      total_amount: orders.totalAmount,
      created_at: orders.createdAt,
      table_id: orders.tableId,
      tableNumber: tables.tableNumber,
      transactionId: sql<string>`
        (SELECT ${transactions.id} FROM ${transactions}
         WHERE ${transactions.orderId} = ${orders.id}
           AND ${transactions.status} = 'success'
         LIMIT 1)
      `,
    })
    .from(orders)
    .leftJoin(tables, eq(orders.tableId, tables.id))
    .where(whereClause)
    .orderBy(desc(orders.createdAt));

  // Fetch items for each order
  const orderIds = activeOrders.map((o) => o.id);
  let itemsByOrder: Record<string, any[]> = {};

  if (orderIds.length > 0) {
    const allItems = await db
      .select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        modifiers: orderItems.modifiers,
        name: menuItems.name,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(inArray(orderItems.orderId, orderIds));

    for (const item of allItems) {
      if (!itemsByOrder[item.orderId]) itemsByOrder[item.orderId] = [];
      itemsByOrder[item.orderId].push(item);
    }
  }

  const ordersWithItems = activeOrders.map((o) => ({
    ...o,
    items: itemsByOrder[o.id] || [],
  }));

  return NextResponse.json(ordersWithItems);
}
