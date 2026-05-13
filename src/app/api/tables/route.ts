import { NextResponse } from "next/server";
import { db } from "@/db";
import { tables, hotels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hotelTables = await db
    .select({
      id: tables.id,
      tableNumber: tables.tableNumber,
      hotelSlug: hotels.slug,
    })
    .from(tables)
    .innerJoin(hotels, eq(tables.hotelId, hotels.id))
    .where(eq(tables.hotelId, roleInfo.hotelId));

  return NextResponse.json(hotelTables);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tableNumber } = await req.json();

  const [newTable] = await db.insert(tables).values({
    hotelId: roleInfo.hotelId,
    tableNumber,
  }).returning();

  return NextResponse.json(newTable);
}
