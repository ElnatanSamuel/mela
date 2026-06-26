import { NextResponse } from "next/server";
import { db } from "@/db";
import { combos, comboItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  const [updated] = await db
    .update(combos)
    .set({ ...body, updatedAt: new Date() })
    .where(and(eq(combos.id, id), eq(combos.hotelId, roleInfo.hotelId)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await db.delete(comboItems).where(eq(comboItems.comboId, id));
  await db.delete(combos).where(and(eq(combos.id, id), eq(combos.hotelId, roleInfo.hotelId)));

  return NextResponse.json({ success: true });
}
