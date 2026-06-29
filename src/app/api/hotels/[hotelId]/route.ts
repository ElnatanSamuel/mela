import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotels, hotelUsers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth-utils";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;
    const body = await req.json();

    // If changing status, verify admin auth
    if (body.status) {
      const session = await getSession();
      if (!session?.data?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const [adminUser] = await db
        .select()
        .from(hotelUsers)
        .where(
          and(
            eq(hotelUsers.userId, session.data.user.id),
            eq(hotelUsers.role, "platform_admin")
          )
        )
        .limit(1);
      if (!adminUser) {
        return NextResponse.json({ error: "Only platform admins can change hotel status" }, { status: 403 });
      }
    }

    const [existing] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const { currency, vatRate, serviceChargeRate, ...rest } = body;

    const currentSettings = existing.settings as Record<string, any>;
    const settings = {
      ...currentSettings,
      ...(currency !== undefined && { currency }),
      ...(vatRate !== undefined && { vatRate: parseFloat(vatRate) / 100 }),
      ...(serviceChargeRate !== undefined && { serviceChargeRate: parseFloat(serviceChargeRate) / 100 }),
    };

    const [updated] = await db
      .update(hotels)
      .set({
        ...rest,
        settings,
        updatedAt: new Date(),
      })
      .where(eq(hotels.id, hotelId))
      .returning();

    return NextResponse.json(updated);
  } catch (err) {
    console.error("Update hotel error:", err);
    return NextResponse.json(
      { error: "Failed to update hotel" },
      { status: 500 }
    );
  }
}
