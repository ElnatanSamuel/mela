import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelIdParam = searchParams.get("hotelId");

  // 1. Check for authenticated user first (for dashboard)
  const roleInfo = await getUserRole();
  const hotelId = hotelIdParam || roleInfo?.hotelId;

  if (!hotelId) {
    return NextResponse.json({ error: "Unauthorized or missing hotelId" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.hotelId, hotelId));

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only 'owner', 'manager', or 'platform_admin' can manage the menu.
  const allowedRoles = ['owner', 'manager', 'platform_admin'];
  if (!allowedRoles.includes(roleInfo.role)) {
    return NextResponse.json({ 
      error: `Forbidden: Only managers or owners can modify the menu.` 
    }, { status: 403 });
  }

  const body = await req.json();
  
  if (!body.categoryId) {
     return NextResponse.json({ error: "Category is required" }, { status: 400 });
  }

  const [newItem] = await db.insert(menuItems).values({
    ...body,
    hotelId: roleInfo.hotelId,
  }).returning();

  return NextResponse.json(newItem);
}
