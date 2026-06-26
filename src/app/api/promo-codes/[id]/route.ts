import { NextResponse } from "next/server";
import { db } from "@/db";
import { promoCodes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updateData: Record<string, any> = {};
  if (body.code !== undefined) updateData.code = body.code;
  if (body.discountType !== undefined) updateData.discountType = body.discountType;
  if (body.discountValue !== undefined) updateData.discountValue = body.discountValue;
  if (body.minOrderAmount !== undefined) updateData.minOrderAmount = body.minOrderAmount;
  if (body.maxUses !== undefined) updateData.maxUses = body.maxUses;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;
  if (body.validFrom !== undefined) updateData.validFrom = new Date(body.validFrom);
  if (body.validUntil !== undefined) updateData.validUntil = body.validUntil ? new Date(body.validUntil) : null;

  const [updated] = await db
    .update(promoCodes)
    .set(updateData)
    .where(and(eq(promoCodes.id, id), eq(promoCodes.hotelId, roleInfo.hotelId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [deleted] = await db
    .delete(promoCodes)
    .where(and(eq(promoCodes.id, id), eq(promoCodes.hotelId, roleInfo.hotelId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Promo code not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
