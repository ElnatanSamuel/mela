import { db } from "@/db";
export const dynamic = 'force-dynamic';

import { hotels, tables } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import GuestMenu from "@/components/guest/GuestMenu";
import { cn } from "@/lib/utils";

interface GuestPageProps {
  params: Promise<{
    hotelSlug: string;
    tableId: string;
  }>;
}

export default async function GuestPage({ params }: GuestPageProps) {
  const { hotelSlug, tableId } = await params;

  // 1. Fetch Hotel
  const [hotel] = await db
    .select()
    .from(hotels)
    .where(eq(hotels.slug, hotelSlug))
    .limit(1);

  if (!hotel) return notFound();

  // 2. Fetch Table with safety for "default" or invalid UUIDs
  let table;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      tableId,
    );

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

  // If no table exists yet, we still show the menu but with a placeholder table
  const displayTable = table || {
    tableNumber: "DEMO",
    id: "00000000-0000-0000-0000-000000000000",
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-50 pb-24 text-neutral-900 dark:text-neutral-900">
      {/* Visual Brand Identity */}
      {hotel.bannerUrl && (
        <div className="w-full h-32 md:h-48 overflow-hidden relative border-b border-neutral-900">
          <img
            src={hotel.bannerUrl}
            alt="Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/40 to-transparent" />
        </div>
      )}

      {/* Branded Header */}
      <header
        className={cn(
          "bg-white border-b border-neutral-200 px-6 py-8 sticky top-0 z-50 transition-all",
          hotel.bannerUrl ? "-mt-10 mx-0 rounded-b-[24px] shadow-2xl" : "",
        )}
      >
        <div className="max-w-2xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {hotel.logoUrl && (
              <div className="w-12 h-12 bg-white border border-neutral-100 rounded-[8px] p-1.5 shadow-sm overflow-hidden flex-shrink-0">
                <img
                  src={hotel.logoUrl}
                  alt={hotel.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div>
              <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tighter leading-none">
                {hotel.name}
              </h1>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400 mt-1.5 flex items-center gap-2">
                <span className="px-2 py-0.5 bg-neutral-900 text-white rounded-[4px] text-[8px]">
                  Table {displayTable.tableNumber}
                </span>
                <span className="opacity-50">•</span>
                Menu
              </p>
            </div>
          </div>

          <div className="hidden md:block">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black uppercase text-neutral-900 tracking-widest leading-none">
                Status
              </span>
              <span className="text-[8px] font-bold text-green-500 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
        </div>
      </header>

      {hotel.bannerUrl && <div className="h-10" />}

      <main className="max-w-2xl mx-auto p-6">
        <GuestMenu hotelId={hotel.id} tableId={displayTable.id} hotelName={hotel.name} />
      </main>

      <footer className="py-12 text-center">
        <p className="text-[8px] font-black uppercase tracking-widest text-neutral-300">
          Ordering powered by Mela™
        </p>
      </footer>
    </div>
  );
}
