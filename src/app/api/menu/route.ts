import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.hotelId, roleInfo.hotelId));

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only owners/managers can add items (security tweak)
  if (roleInfo.role === 'waiter') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  
  const [newItem] = await db.insert(menuItems).values({
    ...body,
    hotelId: roleInfo.hotelId,
  }).returning();

  return NextResponse.json(newItem);
}

export async function PATCH(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;

  const [updatedItem] = await db
    .update(menuItems)
    .set(updates)
    .where(and(
      eq(menuItems.id, id),
      eq(menuItems.hotelId, roleInfo.hotelId)
    ))
    .returning();

  return NextResponse.json(updatedItem);
}
