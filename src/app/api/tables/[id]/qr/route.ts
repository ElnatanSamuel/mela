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
  
  // 1. Fetch table and hotel info
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

  // 2. Generate QR with the slug
  const qrDataUrl = await generateTableQR(tableInfo.hotelSlug, tableInfo.tableId);
  
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
