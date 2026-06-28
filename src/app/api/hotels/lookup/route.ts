import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { or, ilike, eq } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const token = searchParams.get("token");
    const q = searchParams.get("q");

    // Token-based lookup (secure, unguessable)
    if (token) {
      // Try clock_token first, then kitchen_token
      let [hotel] = await db
        .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
        .from(hotels)
        .where(eq(hotels.clockToken, token))
        .limit(1);

      if (!hotel) {
        [hotel] = await db
          .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
          .from(hotels)
          .where(eq(hotels.kitchenToken, token))
          .limit(1);
      }

      if (!hotel) {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
      }

      return NextResponse.json(hotel);
    }

    // Slug lookup (legacy, still works for search/display)
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

    // Search by name/slug, or return all if no query
    if (q !== null) {
      const results = q.length > 0
        ? await db
            .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
            .from(hotels)
            .where(or(ilike(hotels.name, `%${q}%`), ilike(hotels.slug, `%${q}%`)))
            .limit(10)
        : await db
            .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
            .from(hotels)
            .limit(10);

      return NextResponse.json(results);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Hotel lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
