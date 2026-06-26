import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ hotelId: string }> }
) {
  try {
    const { hotelId } = await params;

    const [existing] = await db
      .select()
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const body = await req.json();
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
