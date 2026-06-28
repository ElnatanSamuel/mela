import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const trxRef = searchParams.get("trx_ref");
    const refId = searchParams.get("ref_id");
    const status = searchParams.get("status");

    if (!trxRef) {
      return new NextResponse("Missing trx_ref", { status: 400 });
    }

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      return new NextResponse("Chapa not configured", { status: 500 });
    }

    // Verify with Chapa API
    const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${trxRef}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await verifyRes.json();

    if (verifyData.status !== "success" || verifyData.data?.status !== "success") {
      return new NextResponse("Payment not verified", { status: 400 });
    }

    // Extract orderId from tx_ref (format: mela-{orderId}-{timestamp})
    const parts = trxRef.split("-");
    const orderId = parts.length >= 3 ? parts.slice(1, -1).join("-") : null;

    if (!orderId) {
      return new NextResponse("Invalid tx_ref format", { status: 400 });
    }

    // Get the order
    const [order] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // Skip if already paid
    if (order.paymentStatus === "paid") {
      return new NextResponse("Already processed", { status: 200 });
    }

    // Update order payment status
    await db
      .update(orders)
      .set({ paymentStatus: "paid" })
      .where(eq(orders.id, orderId));

    // Record real transaction
    await db.insert(transactions).values({
      orderId,
      hotelId: order.hotelId,
      amount: order.totalAmount,
      paymentMethod: "chapa",
      providerReference: refId || verifyData.data?.ref_id || trxRef,
      status: "success",
    });

    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Chapa callback error:", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
