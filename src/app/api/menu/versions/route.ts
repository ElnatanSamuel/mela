import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuVersions, menuItems, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelIdParam = searchParams.get("hotelId");

  const roleInfo = await getUserRole();
  const hotelId = hotelIdParam || roleInfo?.hotelId;

  if (!hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const versions = await db
    .select()
    .from(menuVersions)
    .where(eq(menuVersions.hotelId, hotelId))
    .orderBy(menuVersions.createdAt);

  return NextResponse.json(versions);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, status } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const [items, cats] = await Promise.all([
    db.select().from(menuItems).where(eq(menuItems.hotelId, roleInfo.hotelId)),
    db.select().from(categories).where(eq(categories.hotelId, roleInfo.hotelId)),
  ]);

  const [version] = await db
    .insert(menuVersions)
    .values({
      hotelId: roleInfo.hotelId,
      name,
      status: status || "draft",
      menuData: { items, categories: cats },
      publishedAt: status === "published" ? new Date() : null,
    })
    .returning();

  return NextResponse.json(version);
}
