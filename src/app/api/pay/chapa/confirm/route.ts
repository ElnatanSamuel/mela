import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: Request) {
  try {
    const { orderId, txRef } = await req.json();

    if (!orderId || !txRef) {
      return NextResponse.json({ error: "orderId and txRef required" }, { status: 400 });
    }

    // Verify with Chapa
    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Chapa not configured" }, { status: 500 });
    }

    const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await verifyRes.json();

    if (verifyData.status !== "success" || verifyData.data?.status !== "success") {
      return NextResponse.json({ error: "Payment not verified" }, { status: 400 });
    }

    // Get the order to find hotelId
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Skip if already paid
    if (order.paymentStatus === "paid") {
      return NextResponse.json({ success: true, message: "Already confirmed" });
    }

    // Update order payment status
    await db
      .update(orders)
      .set({ paymentStatus: "paid" })
      .where(eq(orders.id, orderId));

    // Record transaction
    await db.insert(transactions).values({
      orderId,
      hotelId: order.hotelId,
      amount: order.totalAmount,
      paymentMethod: "chapa",
      providerReference: verifyData.data?.ref_id || txRef,
      status: "success",
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Confirm payment error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
