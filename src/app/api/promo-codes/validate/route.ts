import { NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { eq, and, gte, lte, sql } from "drizzle-orm";

export async function POST(req: Request) {
  const { code, orderAmount } = await req.json();

  if (!code || orderAmount === undefined) {
    return NextResponse.json({ error: "code and orderAmount are required" }, { status: 400 });
  }

  const [promoCode] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);

  if (!promoCode) {
    return NextResponse.json({ valid: false, error: "Invalid promo code" });
  }

  if (!promoCode.isActive) {
    return NextResponse.json({ valid: false, error: "This promo code is no longer active" });
  }

  const now = new Date();
  if (promoCode.validFrom && new Date(promoCode.validFrom) > now) {
    return NextResponse.json({ valid: false, error: "This promo code is not yet valid" });
  }

  if (promoCode.validUntil && new Date(promoCode.validUntil) < now) {
    return NextResponse.json({ valid: false, error: "This promo code has expired" });
  }

  if (promoCode.maxUses > 0 && promoCode.usedCount >= promoCode.maxUses) {
    return NextResponse.json({ valid: false, error: "This promo code has reached its maximum uses" });
  }

  const orderVal = parseFloat(orderAmount);
  const minOrder = parseFloat(promoCode.minOrderAmount || "0");
  if (minOrder > 0 && orderVal < minOrder) {
    return NextResponse.json({
      valid: false,
      error: `Minimum order amount of ${promoCode.minOrderAmount} ETB required`,
    });
  }

  let discount = 0;
  if (promoCode.discountType === "percentage") {
    discount = orderVal * (parseFloat(promoCode.discountValue) / 100);
  } else {
    discount = parseFloat(promoCode.discountValue);
  }

  return NextResponse.json({
    valid: true,
    discount,
    promoCode: {
      id: promoCode.id,
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
    },
  });
}
