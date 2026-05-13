import { NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || roleInfo.role === "waiter") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { id } = await params;

  try {
    // Ensure the category belongs to the user's hotel
    const [deletedCategory] = await db
      .delete(categories)
      .where(
        and(
          eq(categories.id, id),
          eq(categories.hotelId, roleInfo.hotelId)
        )
      )
      .returning();

    if (!deletedCategory) {
      return NextResponse.json({ error: "Category not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Category deleted successfully", id: deletedCategory.id });
  } catch (error) {
    console.error("Delete category error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
