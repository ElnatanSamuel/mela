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

    console.log("[Chapa Confirm] Verifying txRef:", txRef, "for orderId:", orderId);
    const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${txRef}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await verifyRes.json();
    console.log("[Chapa Confirm] Verify response for", txRef, ":", JSON.stringify(verifyData, null, 2));

    if (verifyData.status !== "success" || verifyData.data?.status !== "success") {
      console.error("[Chapa Confirm] Verification failed for txRef:", txRef, "response:", JSON.stringify(verifyData, null, 2));
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
    console.log("[Chapa Confirm] Confirming order", orderId, "as paid");
    await db
      .update(orders)
      .set({ paymentStatus: "paid" })
      .where(eq(orders.id, orderId));

    await db.insert(transactions).values({
      orderId,
      hotelId: order.hotelId,
      amount: order.totalAmount,
      paymentMethod: "chapa",
      providerReference: verifyData.data?.ref_id || txRef,
      status: "success",
    });

    console.log("[Chapa Confirm] Done — order", orderId, "paid via confirm");

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Confirm payment error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
