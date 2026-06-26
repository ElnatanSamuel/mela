import { NextResponse } from "next/server";
import { db } from "@/db";
import { tips, orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const { orderId, amount, method } = await req.json();

  if (!orderId || !amount || !method) {
    return NextResponse.json({ error: "orderId, amount, and method are required" }, { status: 400 });
  }

  const [order] = await db
    .select({ id: orders.id, hotelId: orders.hotelId, tipAmount: orders.tipAmount })
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [tip] = await db.insert(tips).values({
    orderId,
    hotelId: order.hotelId,
    amount,
    method,
  }).returning();

  const currentTip = parseFloat(order.tipAmount || "0");
  await db
    .update(orders)
    .set({ tipAmount: (currentTip + parseFloat(amount)).toFixed(2) })
    .where(eq(orders.id, orderId));

  return NextResponse.json(tip);
}
