import { db } from "@/db";
export const dynamic = 'force-dynamic';

import { hotels, tables } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import GuestMenu from "@/components/guest/GuestMenu";

interface GuestPageProps {
  params: Promise<{
    hotelSlug: string;
    tableId: string;
  }>;
}

export default async function GuestPage({ params }: GuestPageProps) {
  const { hotelSlug, tableId } = await params;

  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.slug, hotelSlug))
    .limit(1);

  if (!hotel) return notFound();

  let table;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(tableId);

  if (isUuid) {
    [table] = await db
      .select()
      .from(tables)
      .where(and(eq(tables.id, tableId), eq(tables.hotelId, hotel.id)))
      .limit(1);
  } else {
    [table] = await db
      .select()
      .from(tables)
      .where(eq(tables.hotelId, hotel.id))
      .limit(1);
  }

  const displayTable = table || {
    tableNumber: "—",
    id: "00000000-0000-0000-0000-000000000000",
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      {/* Hero Banner */}
      <div className="relative h-36 md:h-44 overflow-hidden">
        {hotel.bannerUrl ? (
          <img
            src={hotel.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-stone-800 via-stone-900 to-stone-950" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

        {/* Hotel info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="max-w-2xl mx-auto flex items-end justify-between">
            <div className="flex items-center gap-4">
              {hotel.logoUrl && (
                <div className="w-14 h-14 bg-white rounded-2xl p-2 shadow-2xl flex-shrink-0">
                  <img
                    src={hotel.logoUrl}
                    alt={hotel.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none">
                  {hotel.name}
                </h1>
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    Table {displayTable.tableNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <main className="max-w-2xl mx-auto -mt-10 relative z-10">
        <GuestMenu hotelId={hotel.id} tableId={displayTable.id} hotelName={hotel.name} hotelSlug={hotelSlug} />
      </main>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-stone-200 mt-8">
        <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-300">
          Powered by Mela
        </p>
      </footer>
    </div>
  );
}
