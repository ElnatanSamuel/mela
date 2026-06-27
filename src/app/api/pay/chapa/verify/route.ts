import { NextResponse } from "next/server";

const CHAPA_API = "https://api.chapa.co/v1/transaction/verify";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const txRef = searchParams.get("tx_ref");

    if (!txRef) {
      return NextResponse.json({ error: "tx_ref required" }, { status: 400 });
    }

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Chapa not configured" }, { status: 500 });
    }

    const res = await fetch(`${CHAPA_API}/${txRef}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await res.json();

    if (data.status !== "success") {
      return NextResponse.json({ verified: false, status: data.data?.status || "unknown" });
    }

    return NextResponse.json({
      verified: true,
      status: data.data.status,
      amount: data.data.amount,
      txRef: data.data.tx_ref,
      refId: data.data.ref_id,
    });
  } catch (err: any) {
    console.error("Chapa verify error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
