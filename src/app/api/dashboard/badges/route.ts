import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, complaints } from "@/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  try {
    const roleInfo = await getUserRole();
    if (!roleInfo?.hotelId) return NextResponse.json({});

    const [orderCount] = await db
      .select({ value: count() })
      .from(orders)
      .where(and(eq(orders.hotelId, roleInfo.hotelId), eq(orders.status, "pending")));

    const [complaintCount] = await db
      .select({ value: count() })
      .from(complaints)
      .where(and(eq(complaints.hotelId, roleInfo.hotelId), eq(complaints.status, "new")));

    return NextResponse.json({
      orders: orderCount?.value || 0,
      complaints: complaintCount?.value || 0,
    });
  } catch {
    return NextResponse.json({});
  }
}
