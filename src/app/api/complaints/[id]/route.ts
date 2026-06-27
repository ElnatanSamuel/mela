import { NextResponse } from "next/server";
import { db } from "@/db";
import { complaints } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole, getSession } from "@/lib/auth-utils";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: { user } } = await getSession();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = await getUserRole();
    if (!role?.hotelId) {
      return NextResponse.json({ error: "No hotel found" }, { status: 404 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, response } = body;

    const updates: Record<string, unknown> = {};

    if (status !== undefined) {
      if (!["acknowledged", "resolved"].includes(status)) {
        return NextResponse.json(
          { error: "Status must be 'acknowledged' or 'resolved'" },
          { status: 400 }
        );
      }
      updates.status = status;
    }

    if (response !== undefined) {
      updates.response = response;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.respondedBy = user.id;
    updates.respondedAt = new Date();

    const data = await db
      .update(complaints)
      .set(updates)
      .where(
        and(
          eq(complaints.id, id),
          eq(complaints.hotelId, role.hotelId)
        )
      )
      .returning();

    if (data.length === 0) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Failed to update complaint:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
