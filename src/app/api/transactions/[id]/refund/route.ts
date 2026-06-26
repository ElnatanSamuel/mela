import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, orders, auditLogs } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { reason } = await req.json();

  if (!reason) {
    return NextResponse.json({ error: "Reason is required" }, { status: 400 });
  }

  const [transaction] = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.hotelId, roleInfo.hotelId)))
    .limit(1);

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  if (transaction.status !== "success") {
    return NextResponse.json({ error: "Only successful transactions can be refunded" }, { status: 400 });
  }

  const [refunded] = await db
    .update(transactions)
    .set({
      status: "refunded",
      refundedAt: new Date(),
      refundReason: reason,
    })
    .where(eq(transactions.id, id))
    .returning();

  const orderTransactions = await db
    .select()
    .from(transactions)
    .where(eq(transactions.orderId, transaction.orderId));

  const hasSuccessful = orderTransactions.some((t) => t.status === "success" && t.id !== id);
  const paymentStatus = hasSuccessful ? "partially_paid" : "unpaid";

  await db
    .update(orders)
    .set({ paymentStatus })
    .where(eq(orders.id, transaction.orderId));

  await db.insert(auditLogs).values({
    hotelId: roleInfo.hotelId,
    userId: roleInfo.hotelId,
    action: "refund",
    entityType: "transaction",
    entityId: id,
    oldData: { status: transaction.status, paymentStatus: transaction.status === "success" ? "paid" : "unpaid" },
    newData: { status: "refunded", paymentStatus, reason },
  });

  return NextResponse.json(refunded);
}
