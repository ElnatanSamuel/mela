import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, hotels, tables } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

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

    // Fire-and-forget print via API
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
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      eq(orders.hotelId, roleInfo.hotelId)
    ))
    .returning();

  if (!updatedOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Trigger print when order is confirmed (kitchen-approved)
  if (body.status === "confirmed" && roleInfo.hotelId) {
    triggerPrint(orderId, roleInfo.hotelId);
  }

  return NextResponse.json(updatedOrder);
}
