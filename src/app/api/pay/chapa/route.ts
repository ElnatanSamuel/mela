import { NextResponse } from "next/server";

const CHAPA_API = "https://api.chapa.co/v1/transaction/initialize";

export async function POST(req: Request) {
  try {
    const { amount, email, firstName, lastName, phone, txRef, hotelName, orderId } = await req.json();

    if (!amount || !txRef) {
      return NextResponse.json({ error: "Amount and txRef required" }, { status: 400 });
    }

    const secretKey = process.env.CHAPA_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json({ error: "Chapa not configured" }, { status: 500 });
    }

    const host = req.headers.get("host") || "localhost:3005";
    const protocol = req.headers.get("x-forwarded-proto") || "https";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
    const callbackUrl = `${baseUrl}/api/pay/chapa/callback`;
    const returnUrl = `${baseUrl}/payment/success?tx_ref=${txRef}${orderId ? `&order_id=${orderId}` : ""}`;
    console.log("[Chapa Init] baseUrl:", baseUrl, "callback:", callbackUrl, "return:", returnUrl);

    const payload = {
      amount: amount.toString(),
      currency: "ETB",
      email: email || "guest@mela.et",
      first_name: firstName || "Guest",
      last_name: lastName || "",
      phone_number: phone || undefined,
      tx_ref: txRef,
      callback_url: callbackUrl,
      return_url: returnUrl,
      "customization[title]": hotelName || "Mela Order",
      "customization[description]": "Payment for your order",
    };

    const res = await fetch(CHAPA_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.status !== "success") {
      console.error("Chapa init failed:", JSON.stringify(data, null, 2));
      const errMsg = typeof data.message === "string" ? data.message
        : data.message?.tx_ref?.[0] || data.message?.amount?.[0] || "Payment initialization failed";
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    return NextResponse.json({ checkoutUrl: data.data.checkout_url, txRef });
  } catch (err: any) {
    console.error("Chapa init error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
