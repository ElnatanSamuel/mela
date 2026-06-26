import { NextResponse } from "next/server";
import { db } from "@/db";
import { inventoryItems } from "@/db/schema";
import { eq, lt, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId") || roleInfo.hotelId;

  const items = await db
    .select()
    .from(inventoryItems)
    .where(and(
      eq(inventoryItems.hotelId, hotelId),
      lt(inventoryItems.stockQuantity, inventoryItems.lowStockThreshold),
    ))
    .orderBy(inventoryItems.name);

  return NextResponse.json(items);
}
