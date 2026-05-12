import { NextResponse } from "next/server";
import { db } from "@/db";
import { tables } from "@/db/schema";
import { eq } from "drizzle-orm";
import { generateTableQR } from "@/lib/qr";
import { getUserRole } from "@/lib/auth-utils";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const roleInfo = await getUserRole();
  if (!roleInfo) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tableId = params.id;
  
  const [table] = await db
    .select()
    .from(tables)
    .where(eq(tables.id, tableId));

  if (!table) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const qrDataUrl = await generateTableQR(table.hotelId, table.id);
  
  if (!qrDataUrl) return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });

  // Convert Data URL to Buffer for image response
  const base64Data = qrDataUrl.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `inline; filename="table-${table.tableNumber}-qr.png"`,
    },
  });
}
