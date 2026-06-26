import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuModifiers } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const menuItemId = searchParams.get("menuItemId");

  if (!menuItemId) {
    return NextResponse.json({ error: "menuItemId query param is required" }, { status: 400 });
  }

  const modifiers = await db
    .select()
    .from(menuModifiers)
    .where(and(eq(menuModifiers.menuItemId, menuItemId), eq(menuModifiers.isAvailable, true)))
    .orderBy(menuModifiers.type);

  return NextResponse.json(modifiers);
}
