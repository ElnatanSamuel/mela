import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerProfiles, loyaltyTransactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [customer] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.id, id))
    .limit(1);

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (roleInfo.role !== "platform_admin" && customer.hotelId !== roleInfo.hotelId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const loyaltyTxns = await db
    .select()
    .from(loyaltyTransactions)
    .where(eq(loyaltyTransactions.customerId, id))
    .orderBy(desc(loyaltyTransactions.createdAt));

  return NextResponse.json({ ...customer, loyaltyTransactions: loyaltyTxns });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const [existing] = await db
    .select()
    .from(customerProfiles)
    .where(eq(customerProfiles.id, id))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (roleInfo.role !== "platform_admin" && existing.hotelId !== roleInfo.hotelId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updateData: Record<string, any> = {};

  if (body.name !== undefined) updateData.name = body.name;
  if (body.phone !== undefined) updateData.phone = body.phone;

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const [updated] = await db
    .update(customerProfiles)
    .set(updateData)
    .where(eq(customerProfiles.id, id))
    .returning();

  return NextResponse.json(updated);
}
