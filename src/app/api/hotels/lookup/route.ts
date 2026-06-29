import { NextResponse } from "next/server";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { or, ilike, eq, and } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const token = searchParams.get("token");
    const q = searchParams.get("q");

    // Token-based lookup (secure, unguessable) — allow pending hotels
    if (token) {
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

    // Slug lookup (public guest menu) — only approved hotels
    if (slug) {
      const [hotel] = await db
        .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
        .from(hotels)
        .where(and(eq(hotels.slug, slug), eq(hotels.status, "approved")))
        .limit(1);

      if (!hotel) {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
      }

      return NextResponse.json(hotel);
    }

    // Search — only approved hotels
    if (q !== null) {
      const results = q.length > 0
        ? await db
            .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
            .from(hotels)
            .where(and(
              or(ilike(hotels.name, `%${q}%`), ilike(hotels.slug, `%${q}%`)),
              eq(hotels.status, "approved")
            ))
            .limit(10)
        : await db
            .select({ id: hotels.id, name: hotels.name, slug: hotels.slug })
            .from(hotels)
            .where(eq(hotels.status, "approved"))
            .limit(10);

      return NextResponse.json(results);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Hotel lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
