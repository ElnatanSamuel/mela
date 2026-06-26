import { NextResponse } from "next/server";
import { db } from "@/db";
import { menuVersions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roleInfo = await getUserRole();
  if (!roleInfo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { status } = await req.json();

  const updateData: Record<string, any> = {};
  if (status) updateData.status = status;
  if (status === "published") updateData.publishedAt = new Date();

  const [updated] = await db
    .update(menuVersions)
    .set(updateData)
    .where(eq(menuVersions.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const roleInfo = await getUserRole();
  if (!roleInfo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [existing] = await db
    .select()
    .from(menuVersions)
    .where(eq(menuVersions.id, id));

  if (!existing) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  if (existing.status !== "draft") {
    return NextResponse.json(
      { error: "Only draft versions can be deleted" },
      { status: 400 },
    );
  }

  await db.delete(menuVersions).where(eq(menuVersions.id, id));

  return NextResponse.json({ deleted: true });
}
