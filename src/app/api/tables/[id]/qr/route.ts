import { NextResponse } from "next/server";
import { db } from "@/db";
import { tables, hotels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateTableQR } from "@/lib/qr";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: tableId } = await params;
  
  const [tableInfo] = await db
    .select({
      tableNumber: tables.tableNumber,
      hotelSlug: hotels.slug,
      tableId: tables.id,
    })
    .from(tables)
    .innerJoin(hotels, eq(tables.hotelId, hotels.id))
    .where(eq(tables.id, tableId));

  if (!tableInfo) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host") || process.env.NEXT_PUBLIC_APP_URL || "localhost:3005";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

  const qrDataUrl = await generateTableQR(tableInfo.hotelSlug, tableInfo.tableId, baseUrl);
  
  if (!qrDataUrl) return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });

  const base64Data = qrDataUrl.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="table-${tableInfo.tableNumber}-qr.png"`,
    },
  });
}
