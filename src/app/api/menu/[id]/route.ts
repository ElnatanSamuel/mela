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

  const { isAvailable, price, name, nameAm, imageUrl, categoryId } = await req.json();
  const { id } = await params;

  const [updatedItem] = await db
    .update(menuItems)
    .set({ 
      ...(isAvailable !== undefined && { isAvailable }),
      ...(price !== undefined && { price }),
      ...(name !== undefined && { name }),
      ...(nameAm !== undefined && { nameAm }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(categoryId !== undefined && { categoryId }),
    })
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
