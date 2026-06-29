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

    // Extract orderId from tx_ref (format: mel-{shortId}-{shortTs})
    const parts = trxRef.split("-");
    const shortId = parts.length >= 2 ? parts[1] : null;

    if (!shortId) {
      return new NextResponse("Invalid tx_ref format", { status: 400 });
    }

    // Look up order by matching first 8 chars of UUID
    const rows = await db.execute(
      `SELECT id, hotel_id, total_amount, payment_status FROM orders WHERE id::text LIKE '${shortId}%' LIMIT 1`
    );
    const orderRow = rows?.[0] as { id: string; hotel_id: string; total_amount: string; payment_status: string } | undefined;
    if (!orderRow) {
      return new NextResponse("Order not found", { status: 404 });
    }
    const orderId = orderRow.id;
    const hotelId = orderRow.hotel_id;
    const totalAmount = orderRow.total_amount;
    const paymentStatus = orderRow.payment_status;

    // Skip if already processed (idempotent)
    const [existingTx] = await db
      .select()
      .from(transactions)
      .where(eq(transactions.providerReference, trxRef))
      .limit(1);
    if (existingTx) {
      return new NextResponse("Already processed", { status: 200 });
    }

    // Skip if already paid
    if (paymentStatus === "paid") {
      return new NextResponse("Already paid", { status: 200 });
    }

    // Mark as paid
    await db
      .update(orders)
      .set({ paymentStatus: "paid" })
      .where(eq(orders.id, orderId));

    // Record transaction
    await db.insert(transactions).values({
      orderId,
      hotelId,
      amount: totalAmount,
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
