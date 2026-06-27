import { NextResponse } from "next/server";
import { db } from "@/db";
import { receiptSettings, hotels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hotelIdParam = searchParams.get("hotelId");

  const roleInfo = await getUserRole();
  const hotelId = hotelIdParam || roleInfo?.hotelId;

  if (!hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [settings] = await db
    .select()
    .from(receiptSettings)
    .where(eq(receiptSettings.hotelId, hotelId));

  const [hotel] = await db
    .select({ name: hotels.name, logoUrl: hotels.logoUrl, location: hotels.location, phone: hotels.phone })
    .from(hotels)
    .where(eq(hotels.id, hotelId));

  return NextResponse.json({
    ...(settings || {
      headerText: "Thank you!",
      footerText: "Visit again!",
      showLogo: true,
      showVat: true,
      showServiceCharge: true,
      showItemStatus: false,
    }),
    hotel: hotel || null,
  });
}

export async function POST(req: Request) {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const [existing] = await db
    .select()
    .from(receiptSettings)
    .where(eq(receiptSettings.hotelId, roleInfo.hotelId));

  let result;
  if (existing) {
    [result] = await db
      .update(receiptSettings)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(receiptSettings.hotelId, roleInfo.hotelId))
      .returning();
  } else {
    [result] = await db
      .insert(receiptSettings)
      .values({ ...body, hotelId: roleInfo.hotelId })
      .returning();
  }

  return NextResponse.json(result);
}
