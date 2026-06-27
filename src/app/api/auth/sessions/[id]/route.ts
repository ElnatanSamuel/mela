import { NextResponse } from "next/server";
import { db } from "@/db";
import { userSessions } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";

// DELETE — Revoke a session
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: { user } } = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [revoked] = await db
      .update(userSessions)
      .set({ isActive: false, revokedAt: new Date() })
      .where(and(eq(userSessions.id, id), eq(userSessions.userId, user.id)))
      .returning();

    if (!revoked) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session revoke error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — Refresh heartbeat
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { data: { user } } = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const [refreshed] = await db
      .update(userSessions)
      .set({ lastActiveAt: new Date() })
      .where(and(eq(userSessions.id, id), eq(userSessions.userId, user.id), eq(userSessions.isActive, true)))
      .returning();

    if (!refreshed) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Session refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
