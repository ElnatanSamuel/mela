import { NextResponse } from "next/server";
import { db } from "@/db";
import { customerProfiles } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId");
  const phone = searchParams.get("phone");

  if (!hotelId || !phone) {
    return NextResponse.json({ error: "hotelId and phone required" }, { status: 400 });
  }

  const [profile] = await db
    .select()
    .from(customerProfiles)
    .where(and(eq(customerProfiles.hotelId, hotelId), eq(customerProfiles.phone, phone)))
    .limit(1);

  if (!profile) {
    return NextResponse.json({ exists: false, profile: null });
  }

  return NextResponse.json({
    exists: true,
    profile: {
      visitCount: profile.visitCount,
      totalSpent: profile.totalSpent,
      lastVisit: profile.lastVisit,
      loyaltyPoints: profile.loyaltyPoints,
    },
  });
}
