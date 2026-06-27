import { NextResponse } from "next/server";
import { db } from "@/db";
import { shifts, orders } from "@/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const activeShift = await db
    .select()
    .from(shifts)
    .where(and(eq(shifts.hotelId, roleInfo.hotelId), isNull(shifts.closedAt)))
    .limit(1);

  return NextResponse.json(activeShift[0] || null);
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, cashAtOpen } = await req.json();

  if (action === "open") {
    const [shift] = await db.insert(shifts).values({
      hotelId: roleInfo.hotelId,
      openedBy: roleInfo.userId || null,
      cashAtOpen: cashAtOpen || "0",
    }).returning();

    return NextResponse.json(shift);
  }

  if (action === "close") {
    const activeShift = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.hotelId, roleInfo.hotelId), isNull(shifts.closedAt)))
      .limit(1);

    if (!activeShift[0]) {
      return NextResponse.json({ error: "No active shift" }, { status: 400 });
    }

    const totals = await db
      .select({
        totalCash: sql<string>`sum(case when order_type = 'cash' then cast(total_amount as numeric) else 0 end)`,
        totalDigital: sql<string>`sum(case when order_type = 'digital' then cast(total_amount as numeric) else 0 end)`,
        orderCount: sql<number>`count(*)`,
      })
      .from(orders)
      .where(and(eq(orders.hotelId, roleInfo.hotelId), eq(orders.shiftId, activeShift[0].id)));

    const [closed] = await db
      .update(shifts)
      .set({
        closedAt: new Date(),
        closedBy: roleInfo.userId || null,
        totalCash: totals[0]?.totalCash || "0",
        totalDigital: totals[0]?.totalDigital || "0",
        totalOrders: totals[0]?.orderCount || 0,
      })
      .where(eq(shifts.id, activeShift[0].id))
      .returning();

    return NextResponse.json(closed);
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
