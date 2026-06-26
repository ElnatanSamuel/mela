import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customerProfiles } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get("hotelId") || roleInfo.hotelId;

  if (!hotelId) return NextResponse.json({ error: "hotelId required" }, { status: 400 });

  if (roleInfo.role !== "platform_admin" && hotelId !== roleInfo.hotelId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const customers = await db
    .select({
      id: customerProfiles.id,
      name: customerProfiles.name,
      phone: customerProfiles.phone,
      visitCount: customerProfiles.visitCount,
      totalSpent: customerProfiles.totalSpent,
      lastVisit: customerProfiles.lastVisit,
      loyaltyPoints: customerProfiles.loyaltyPoints,
    })
    .from(customerProfiles)
    .where(eq(customerProfiles.hotelId, hotelId))
    .orderBy(desc(customerProfiles.lastVisit));

  return NextResponse.json(customers);
}
