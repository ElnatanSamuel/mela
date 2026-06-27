import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { or, ilike, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const q = searchParams.get("q");

    if (slug) {
      const [hotel] = await db
        .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
        .from(hotels)
        .where(eq(hotels.slug, slug))
        .limit(1);

      if (!hotel) {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
      }

      return NextResponse.json(hotel);
    }

    if (q && q.length > 1) {
      const results = await db
        .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
        .from(hotels)
        .where(or(ilike(hotels.name, `%${q}%`), ilike(hotels.slug, `%${q}%`)))
        .limit(10);

      return NextResponse.json(results);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Hotel lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
