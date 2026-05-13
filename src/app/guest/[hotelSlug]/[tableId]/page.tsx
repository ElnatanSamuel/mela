import { db } from "@/db";
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
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Branded Header */}
      <header className="bg-white border-b border-neutral-200 px-6 py-8 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto flex justify-between items-end">
          <div>
            <h1 className="text-xl font-black text-neutral-900 uppercase tracking-tighter leading-none">
              {hotel.name}
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mt-2">
              Table {displayTable.tableNumber} • Guest Menu
            </p>
          </div>
          {hotel.logoUrl && (
            <img
              src={hotel.logoUrl}
              alt={hotel.name}
              className="w-12 h-12 object-contain"
            />
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6">
        <GuestMenu hotelId={hotel.id} tableId={displayTable.id} />
      </main>

      <footer className="py-12 text-center">
        <p className="text-[8px] font-black uppercase tracking-widest text-neutral-300">
          Ordering powered by Mela™
        </p>
      </footer>
    </div>
  );
}
