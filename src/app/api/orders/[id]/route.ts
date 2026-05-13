import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { status } = await req.json();
  const { id: orderId } = await params;

  const [updatedOrder] = await db
    .update(orders)
    .set({ status })
    .where(and(
      eq(orders.id, orderId),
      eq(orders.hotelId, roleInfo.hotelId)
    ))
    .returning();

  if (!updatedOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(updatedOrder);
}
