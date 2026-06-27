import { NextResponse } from "next/server";
import { db } from "@/db";
import { tables } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { tableNumber } = await req.json();

  if (!tableNumber || !tableNumber.trim()) {
    return NextResponse.json({ error: "tableNumber required" }, { status: 400 });
  }

  const [updated] = await db
    .update(tables)
    .set({ tableNumber: tableNumber.trim() })
    .where(and(eq(tables.id, id), eq(tables.hotelId, roleInfo.hotelId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(tables)
    .where(and(eq(tables.id, id), eq(tables.hotelId, roleInfo.hotelId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Table not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
