import { NextResponse } from "next/server";
import { db } from "@/db";
import { customerProfiles, orders } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customers = await db
    .select({
      id: customerProfiles.id,
      phone: customerProfiles.phone,
      visitCount: customerProfiles.visitCount,
      totalSpent: customerProfiles.totalSpent,
      lastVisit: customerProfiles.lastVisit,
      loyaltyPoints: customerProfiles.loyaltyPoints,
      lastOrder: sql<string>`
        (SELECT ${orders.createdAt} FROM ${orders}
         WHERE ${orders.hotelId} = ${customerProfiles.hotelId}
           AND ${orders.customerPhone} = ${customerProfiles.phone}
         ORDER BY ${orders.createdAt} DESC LIMIT 1)
      `,
    })
    .from(customerProfiles)
    .where(eq(customerProfiles.hotelId, roleInfo.hotelId))
    .orderBy(desc(customerProfiles.visitCount));

  return NextResponse.json(customers);
}
