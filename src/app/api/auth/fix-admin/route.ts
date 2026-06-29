import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotelUsers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";

export async function POST() {
  try {
    const session = await getSession();
    const user = session?.data?.user;
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const existing = await db
      .select()
      .from(hotelUsers)
      .where(eq(hotelUsers.userId, user.id))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ role: existing[0].role, message: "Existing role preserved" });
    }

    await db.insert(hotelUsers).values({
      userId: user.id,
      role: "platform_admin",
      hotelId: null,
    });

    return NextResponse.json({ role: "platform_admin", message: "Admin role created" });
  } catch (err: any) {
    console.error("Fix admin error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
