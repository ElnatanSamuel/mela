import { NextResponse } from "next/server";
import { db } from "@/db";
import { tableSections } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sections = await db
    .select()
    .from(tableSections)
    .where(eq(tableSections.hotelId, roleInfo.hotelId))
    .orderBy(asc(tableSections.priority));

  return NextResponse.json(sections);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, priority } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [section] = await db.insert(tableSections).values({
    hotelId: roleInfo.hotelId,
    name,
    priority: priority || 0,
  }).returning();

  return NextResponse.json(section);
}
