import { NextResponse } from "next/server";
import { db } from "@/db";
import { tips } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelIdParam = searchParams.get("hotelId");

  const roleInfo = await getUserRole();
  const hotelId = hotelIdParam || roleInfo?.hotelId;

  if (!hotelId) {
    return NextResponse.json({ error: "Unauthorized or missing hotelId" }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [summary] = await db
    .select({
      todayTotal: sql<number>`coalesce(sum(cast(${tips.amount} as numeric)), 0)`,
      count: sql<number>`count(*)`,
      cashTotal: sql<number>`coalesce(sum(case when ${tips.method} = 'cash' then cast(${tips.amount} as numeric) else 0 end), 0)`,
      digitalTotal: sql<number>`coalesce(sum(case when ${tips.method} = 'digital' then cast(${tips.amount} as numeric) else 0 end), 0)`,
    })
    .from(tips)
    .where(and(eq(tips.hotelId, hotelId), gte(tips.createdAt, today)));

  return NextResponse.json(summary);
}
