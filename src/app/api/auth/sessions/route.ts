import { NextResponse } from "next/server";
import { db } from "@/db";
import { userSessions, hotelUsers } from "@/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
}

function parseDevice(ua: string | null): string {
  if (!ua) return "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Edg")) return "Edge";
  return "Browser";
}

// POST — Register session on login
export async function POST(request: Request) {
  try {
    const { data: { user } } = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const token = generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    const userAgent = request.headers.get("user-agent") || null;
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || request.headers.get("x-real-ip") || null;

    // Look up hotelId from user's role if not provided
    let hotelId = body.hotelId || null;
    if (!hotelId) {
      const [roleEntry] = await db
        .select({ hotelId: hotelUsers.hotelId })
        .from(hotelUsers)
        .where(eq(hotelUsers.userId, user.id))
        .limit(1);
      hotelId = roleEntry?.hotelId || null;
    }

    const [session] = await db
      .insert(userSessions)
      .values({
        userId: user.id,
        hotelId: body.hotelId || null,
        token,
        ipAddress,
        userAgent,
        deviceInfo: parseDevice(userAgent),
        expiresAt,
        lastActiveAt: new Date(),
      })
      .returning();

    return NextResponse.json({ sessionId: session.id, token: session.token, expiresAt: session.expiresAt });
  } catch (error) {
    console.error("Session create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — List active sessions
export async function GET() {
  try {
    const { data: { user } } = await getSession();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const sessions = await db
      .select()
      .from(userSessions)
      .where(and(eq(userSessions.userId, user.id), eq(userSessions.isActive, true), gte(userSessions.expiresAt, new Date())))
      .orderBy(userSessions.lastActiveAt);

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Session list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
