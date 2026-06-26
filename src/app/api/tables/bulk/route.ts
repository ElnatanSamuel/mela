import { NextResponse } from "next/server";
import { db } from "@/db";
import { tables } from "@/db/schema";
import { getUserRole } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { tableNumbers, sectionId, capacity } = await req.json();

  if (!tableNumbers || !Array.isArray(tableNumbers) || tableNumbers.length === 0) {
    return NextResponse.json({ error: "tableNumbers array is required" }, { status: 400 });
  }

  const values = tableNumbers.map((num: string) => ({
    hotelId: roleInfo.hotelId!,
    tableNumber: num.trim(),
    sectionId: sectionId || null,
    capacity: capacity || 4,
  }));

  const created = await db.insert(tables).values(values).returning();

  return NextResponse.json({ count: created.length, tables: created });
}
