import { NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const codes = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.hotelId, roleInfo.hotelId))
    .orderBy(desc(promoCodes.createdAt));

  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { code, discountType, discountValue, minOrderAmount, maxUses, validFrom, validUntil, isActive } = body;

  if (!code || !discountType || !discountValue) {
    return NextResponse.json({ error: "code, discountType, and discountValue are required" }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(promoCodes)
    .where(eq(promoCodes.code, code))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "A promo code with this code already exists" }, { status: 409 });
  }

  const [newCode] = await db.insert(promoCodes).values({
    hotelId: roleInfo.hotelId,
    code,
    discountType,
    discountValue,
    minOrderAmount: minOrderAmount || "0",
    maxUses: maxUses || 0,
    isActive: isActive !== undefined ? isActive : true,
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: validUntil ? new Date(validUntil) : null,
  }).returning();

  return NextResponse.json(newCode);
}
