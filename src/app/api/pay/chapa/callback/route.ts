import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, transactions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: Request) {
  return handleCallback(req);
}

export async function POST(req: Request) {
  return handleCallback(req);
}

async function handleCallback(req: Request) {
  try {
    const url = new URL(req.url);
    const params = Object.fromEntries(url.searchParams.entries());
    console.log("[CHAPA CALLBACK PARAMS]", JSON.stringify(params, null, 2));

    const trxRef = url.searchParams.get("trx_ref") || url.searchParams.get("tx_ref");
    const refId = url.searchParams.get("ref_id");
    const status = url.searchParams.get("status");

    if (!trxRef) {
      return new NextResponse("Missing trx_ref", { status: 400 });
    }

    console.log("[Chapa Callback] Processing trx_ref:", trxRef, "ref_id:", refId, "status:", status);

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      return new NextResponse("Chapa not configured", { status: 500 });
    }

    // Verify with Chapa API
    const verifyRes = await fetch(`https://api.chapa.co/v1/transaction/verify/${trxRef}`, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    const verifyData = await verifyRes.json();
    console.log("[CHAPA CALLBACK VERIFY RESPONSE]", JSON.stringify(verifyData, null, 2));

    if (verifyData.status !== "success" || verifyData.data?.status !== "success") {
      console.error("[Chapa Callback] Payment not verified for trx_ref:", trxRef, "response:", JSON.stringify(verifyData, null, 2));
      return new NextResponse("Payment not verified", { status: 400 });
    }

    // Extract shortId from tx_ref (format: mel-{shortId}-{shortTs})
    const parts = trxRef.split("-");
    const shortId = parts.length >= 2 ? parts[1] : null;
    console.log("[TX REF]", trxRef, "[SHORT ID]", shortId);

    if (!shortId) {
      return new NextResponse("Invalid tx_ref format", { status: 400 });
    }

    // Look up order by matching first 8 chars of UUID (parameterized)
    const rows = await db.execute(
      sql`SELECT id, hotel_id, total_amount, payment_status FROM orders WHERE id::text LIKE ${shortId + '%'} LIMIT 1`
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

    console.log("[Chapa Callback] Marking order", orderId, "as paid");
    await db
      .update(orders)
      .set({ paymentStatus: "paid" })
      .where(eq(orders.id, orderId));

    await db.insert(transactions).values({
      orderId,
      hotelId,
      amount: totalAmount,
      paymentMethod: "chapa",
      providerReference: refId || verifyData.data?.ref_id || trxRef,
      status: "success",
    });

    console.log("[Chapa Callback] Done — order", orderId, "paid, transaction recorded");
    return new NextResponse("OK", { status: 200 });
  } catch (err) {
    console.error("Chapa callback error:", err);
    return new NextResponse("Internal error", { status: 500 });
  }
}
