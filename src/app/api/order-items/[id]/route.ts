import { NextResponse } from "next/server";
import { db } from "@/db";
import { orderItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["served", "cancelled"],
  served: [],
  cancelled: [],
};

const CHEF_TRANSITIONS = ["pending", "preparing"];
const WAITER_TRANSITIONS = ["ready"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();

  if (!status || typeof status !== "string") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const [current] = await db
    .select({ status: orderItems.status })
    .from(orderItems)
    .where(eq(orderItems.id, id))
    .limit(1);

  if (!current) {
    return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[current.status];
  if (!allowed || !allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from ${current.status} to ${status}` },
      { status: 400 }
    );
  }

  if (CHEF_TRANSITIONS.includes(current.status) && !["chef", "manager", "owner"].includes(roleInfo.role)) {
    return NextResponse.json({ error: "Only chefs can perform this action" }, { status: 403 });
  }

  if (WAITER_TRANSITIONS.includes(current.status) && !["waiter", "manager", "owner"].includes(roleInfo.role)) {
    return NextResponse.json({ error: "Only waiters can perform this action" }, { status: 403 });
  }

  const updateData: Record<string, string | null> = { status };
  if (status === "preparing") {
    updateData.startTime = new Date().toISOString();
  }
  if (status === "served") {
    updateData.completedAt = new Date().toISOString();
  }

  const [updated] = await db
    .update(orderItems)
    .set(updateData)
    .where(
      and(
        eq(orderItems.id, id),
        eq(orderItems.status, current.status)
      )
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Item was already updated" }, { status: 409 });
  }

  return NextResponse.json(updated);
}
