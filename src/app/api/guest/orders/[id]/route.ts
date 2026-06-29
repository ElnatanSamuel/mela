import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, orderItems, menuItems, hotels, receiptSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const [hotel] = await db
      .select({
        name: hotels.name,
        logoUrl: hotels.logoUrl,
        location: hotels.location,
        phone: hotels.phone,
      })
      .from(hotels)
      .where(eq(hotels.id, order.hotelId))
      .limit(1);

    const items = await db
      .select({
        name: menuItems.name,
        quantity: orderItems.quantity,
        unitPrice: orderItems.unitPrice,
        modifiers: orderItems.modifiers,
      })
      .from(orderItems)
      .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
      .where(eq(orderItems.orderId, orderId));

    const [settings] = await db
      .select()
      .from(receiptSettings)
      .where(eq(receiptSettings.hotelId, order.hotelId))
      .limit(1);

    return NextResponse.json({
      order: {
        id: order.id,
        totalAmount: order.totalAmount,
        vatAmount: order.vatAmount,
        serviceCharge: order.serviceCharge,
        discountAmount: order.discountAmount,
        tipAmount: order.tipAmount,
        status: order.status,
        paymentStatus: order.paymentStatus,
        orderType: order.orderType,
        createdAt: order.createdAt,
      },
      hotel: hotel || null,
      items: items.map((i) => ({
        name: i.name || "Item",
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        modifiers: i.modifiers ? JSON.parse(i.modifiers as string) : [],
      })),
      receiptSettings: settings || {
        headerText: "Thank you!",
        footerText: "Visit again!",
        showLogo: true,
        showVat: true,
        showServiceCharge: true,
      },
    });
  } catch (err: any) {
    console.error("Guest receipt error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
