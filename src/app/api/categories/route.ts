import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelIdParam = searchParams.get("hotelId");

  const roleInfo = await getUserRole();
  const hotelId = hotelIdParam || roleInfo?.hotelId;

  if (!hotelId) {
    return NextResponse.json({ error: "Unauthorized or missing hotelId" }, { status: 401 });
  }

  const cats = await db
    .select()
    .from(categories)
    .where(eq(categories.hotelId, hotelId))
    .orderBy(categories.priority);

  return NextResponse.json(cats);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const [newCat] = await db.insert(categories).values({
    ...body,
    hotelId: roleInfo.hotelId,
  }).returning();

  return NextResponse.json(newCat);
}
