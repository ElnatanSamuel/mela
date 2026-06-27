import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, tables, transactions, tableAssignments, hotels, orderItems, menuItems } from "@/db/schema";
import { eq, desc, sql, inArray } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isWaiter = roleInfo.role === "waiter";

  // Check hotel settings for table assignment
  const [hotel] = await db
    .select({ settings: hotels.settings })
    .from(hotels)
    .where(eq(hotels.id, roleInfo.hotelId))
    .limit(1);

  const settings = (hotel?.settings as any) || {};
  const assignmentEnabled = settings.enableTableAssignment === true;

  let tableIds: string[] | null = null;

  // If waiter and table assignment is enabled, get assigned table IDs
  if (isWaiter && assignmentEnabled) {
    const assignments = await db
      .select({ tableId: tableAssignments.tableId })
      .from(tableAssignments)
      .where(eq(tableAssignments.userId, roleInfo.userId));

    tableIds = assignments.map((a) => a.tableId);

    // If no tables assigned, return empty
    if (tableIds.length === 0) {
      return NextResponse.json([]);
    }
  }

  const baseQuery = db
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
    .where(
      tableIds
        ? sql`${orders.hotelId} = ${roleInfo.hotelId} AND ${orders.tableId} IN ${tableIds}`
        : eq(orders.hotelId, roleInfo.hotelId)
    )
    .orderBy(desc(orders.createdAt));

  const activeOrders = await baseQuery;

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
