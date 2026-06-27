import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ['owner', 'manager', 'platform_admin'];
  if (!allowedRoles.includes(roleInfo.role)) {
    return NextResponse.json({ 
      error: `Forbidden: Role '${roleInfo.role}' cannot modify menu items.` 
    }, { status: 403 });
  }

  const body = await req.json();
  const { id } = await params;

  const allowedFields: Record<string, any> = {};
  for (const key of [
    "isAvailable", "price", "name", "nameAm", "imageUrl", "categoryId",
    "description", "descriptionAm", "estimatedPrepTime",
    "isSpicy", "isVegetarian", "isDailySpecial", "hasModifiers", "status", "tags",
  ]) {
    if (body[key] !== undefined) allowedFields[key] = body[key];
  }

  const [updatedItem] = await db
    .update(menuItems)
    .set(allowedFields)
    .where(and(
      eq(menuItems.id, id),
      eq(menuItems.hotelId, roleInfo.hotelId)
    ))
    .returning();

  if (!updatedItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(updatedItem);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const allowedRoles = ['owner', 'manager', 'platform_admin'];
  if (!allowedRoles.includes(roleInfo.role)) {
    return NextResponse.json({ 
      error: `Forbidden: Role '${roleInfo.role}' cannot delete menu items.` 
    }, { status: 403 });
  }

  const { id } = await params;

  const [deletedItem] = await db
    .delete(menuItems)
    .where(and(
      eq(menuItems.id, id),
      eq(menuItems.hotelId, roleInfo.hotelId)
    ))
    .returning();

  if (!deletedItem) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
