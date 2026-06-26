import { NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { eq, ilike, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId") || roleInfo.hotelId;
  const search = searchParams.get("search");

  let query = db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.hotelId, hotelId));

  if (search) {
    query = db
      .select()
      .from(inventoryItems)
      .where(and(
        eq(inventoryItems.hotelId, hotelId),
        ilike(inventoryItems.name, `%${search}%`),
      ));
  }

  const items = await query.orderBy(inventoryItems.name);
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, unit, stockQuantity, lowStockThreshold } = await req.json();

  if (!name || !unit) {
    return NextResponse.json({ error: "name and unit are required" }, { status: 400 });
  }

  const [item] = await db.insert(inventoryItems).values({
    hotelId: roleInfo.hotelId,
    name,
    unit,
    stockQuantity: stockQuantity ?? "0",
    lowStockThreshold: lowStockThreshold ?? "0",
  }).returning();

  return NextResponse.json(item);
}
