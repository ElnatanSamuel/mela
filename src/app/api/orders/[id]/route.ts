import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, hotels, tables } from "@/db/schema";
import { eq, and } from "drizzle-orm";
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

async function triggerPrint(orderId: string, hotelId: string) {
  try {
    const [order] = await db
      .select({
        totalAmount: orders.totalAmount,
        vatAmount: orders.vatAmount,
        serviceCharge: orders.serviceCharge,
        tableNumber: tables.tableNumber,
      })
      .from(orders)
      .leftJoin(tables, eq(orders.tableId, tables.id))
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) return;

    const [hotel] = await db
      .select({ name: hotels.name, settings: hotels.settings })
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!hotel) return;

    const items = await db
      .select({
        name: menuItems.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, orderId));

    const { buildReceipt } = await import("@/lib/printer");

    const receipt = buildReceipt({
      hotelName: hotel.name,
      tableNumber: order.tableNumber || "Unknown",
      orderNumber: orderId.slice(0, 8),
      items: items.map((i) => ({
        name: i.name || "Item",
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      totalAmount: order.totalAmount,
      vatAmount: order.vatAmount,
      serviceCharge: order.serviceCharge,
      timestamp: new Date(),
    });

    const settings = hotel.settings as any;
    if (settings?.printerIp) {
      fetch("http://localhost:3000/api/print", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          printerIp: settings.printerIp,
          printerPort: settings.printerPort || 9100,
          data: Array.from(receipt),
        }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error("Print trigger failed:", e);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Try Supabase auth first, then kitchen-session cookie
  let hotelId: string | null = null;

  const roleInfo = await getUserRole();
  if (roleInfo?.hotelId) {
    hotelId = roleInfo.hotelId;
  } else {
    const kitchenSession = await getKitchenSession(req);
    if (kitchenSession) {
      hotelId = kitchenSession.hotelId;
    }
  }

  if (!hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id: orderId } = await params;

  const updateData: any = {};
  if (body.status) updateData.status = body.status;
  if (body.paymentStatus) updateData.paymentStatus = body.paymentStatus;

  const [updatedOrder] = await db
    .update(orders)
    .set(updateData)
    .where(and(
      eq(orders.id, orderId),
      eq(orders.hotelId, hotelId)
    ))
    .returning();

  if (!updatedOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Trigger print when order is confirmed (kitchen-approved)
  if (body.status === "confirmed") {
    triggerPrint(orderId, hotelId);
  }

  return NextResponse.json(updatedOrder);
}
