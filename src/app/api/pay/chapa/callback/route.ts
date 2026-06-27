import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { trx_ref, ref_id, status } = body;

    console.log("Chapa callback:", { trx_ref, ref_id, status });

    // In a production app, you would:
    // 1. Verify the transaction with Chapa's verify endpoint
    // 2. Update the order payment status in your database
    // 3. Mark the transaction as completed

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error("Chapa callback error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
