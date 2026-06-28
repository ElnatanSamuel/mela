import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "mela-kitchen-secret-key-2024");

export async function POST(req: Request) {
  try {
    const { token, pin, type } = await req.json();

    if (!token || !pin || !type) {
      return NextResponse.json({ error: "Token, PIN, and type are required" }, { status: 400 });
    }

    if (type !== "clock" && type !== "kitchen") {
      return NextResponse.json({ error: "Type must be 'clock' or 'kitchen'" }, { status: 400 });
    }

    // Find hotel by clock_token or kitchen_token
    let [hotel] = await db
      .select({ id: hotels.id, name: hotels.name, settings: hotels.settings })
      .from(hotels)
      .where(eq(hotels.clockToken, token))
      .limit(1);

    let pinField = "clockPin";

    if (!hotel) {
      [hotel] = await db
        .select({ id: hotels.id, name: hotels.name, settings: hotels.settings })
        .from(hotels)
        .where(eq(hotels.kitchenToken, token))
        .limit(1);
      pinField = "kitchenPin";
    }

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const settings = (hotel.settings as any) || {};
    const correctPin = type === "clock" ? (settings.clockPin || "1234") : (settings.kitchenPin || "1234");

    if (pin !== correctPin) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    // For kitchen type, create a session cookie
    if (type === "kitchen") {
      const kitchenToken = await new SignJWT({
        hotelId: hotel.id,
        hotelName: hotel.name,
        staffName: "Kitchen Staff",
        role: "kitchen",
      })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime("12h")
        .setIssuedAt()
        .sign(JWT_SECRET);

      const response = NextResponse.json({
        success: true,
        hotelId: hotel.id,
        hotelName: hotel.name,
      });

      response.cookies.set("kitchen-session", kitchenToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      });

      return response;
    }

    // For clock type, just return success (no cookie needed)
    return NextResponse.json({
      success: true,
      hotelId: hotel.id,
      hotelName: hotel.name,
    });
  } catch (err: any) {
    console.error("PIN verify error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
