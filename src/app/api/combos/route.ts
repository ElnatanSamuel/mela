import { NextResponse } from "next/server";
import { db } from "@/db";
import { combos, comboItems, menuItems } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelIdParam = searchParams.get("hotelId");
  const roleInfo = await getUserRole();
  const hotelId = hotelIdParam || (roleInfo ? roleInfo.hotelId : null);

  if (!hotelId) {
    return NextResponse.json({ error: "hotelId required" }, { status: 400 });
  }

  const allCombos = await db
    .select({
      id: combos.id,
      name: combos.name,
      nameAm: combos.nameAm,
      description: combos.description,
      totalPrice: combos.totalPrice,
      isAvailable: combos.isAvailable,
      imageUrl: combos.imageUrl,
    })
    .from(combos)
    .where(and(eq(combos.hotelId, hotelId), eq(combos.isAvailable, true)))
    .orderBy(desc(combos.createdAt));

  const result = [];
  for (const combo of allCombos) {
    const items = await db
      .select({
        menuItemId: comboItems.menuItemId,
        quantity: comboItems.quantity,
        name: menuItems.name,
        price: menuItems.price,
      })
      .from(comboItems)
      .leftJoin(menuItems, eq(comboItems.menuItemId, menuItems.id))
      .where(eq(comboItems.comboId, combo.id));

    const savings = items.reduce(
      (sum, item) => {
        const price = item.price || "0";
        return sum + parseFloat(price) * item.quantity - parseFloat(combo.totalPrice) / items.length * item.quantity;
      },
      0,
    );

    result.push({ ...combo, items, savings: Math.round(savings) });
  }

  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, totalPrice, itemIds, quantities } = body;

  if (!name || !totalPrice || !itemIds || itemIds.length === 0) {
    return NextResponse.json({ error: "name, totalPrice, and itemIds required" }, { status: 400 });
  }

  const [combo] = await db.insert(combos).values({
    hotelId: roleInfo.hotelId,
    name,
    totalPrice,
    isAvailable: true,
  }).returning();

  await db.insert(comboItems).values(
    itemIds.map((itemId: string, idx: number) => ({
      comboId: combo.id,
      menuItemId: itemId,
      quantity: quantities?.[idx] || 1,
    })),
  );

  return NextResponse.json(combo);
}
