import React from "react";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { desc } from "drizzle-orm";
import {
  Search,
  MapPin,
  Phone,
} from "lucide-react";
import { OnboardHotelButton, HotelRowActions } from "@/components/admin/HotelActions";

export default async function HotelDirectoryPage() {
  // Fetch real hotels
  const allHotels = await db.select().from(hotels).orderBy(desc(hotels.createdAt));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-neutral-900 tracking-tighter uppercase">
            Hotel Directory
          </h2>
          <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">
            Manage and orchestrate all platform tenants
          </p>
        </div>
        <OnboardHotelButton />
      </div>

      {/* Search & Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300 group-focus-within:text-neutral-900 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, location, or slug..."
            className="w-full bg-white border border-neutral-200 rounded-[6px] py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900 transition-all placeholder:text-neutral-200"
          />
        </div>
      </div>

      {/* Hotels List */}
      <div className="bg-white border border-neutral-200 rounded-[6px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Hotel Info
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Location
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Contact
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-neutral-400 uppercase tracking-widest text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {allHotels.map((hotel) => (
                <tr
                  key={hotel.id}
                  className="group hover:bg-neutral-50/50 transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-neutral-900 text-white rounded-[6px] flex items-center justify-center font-black text-[10px] uppercase overflow-hidden border border-neutral-800">
                        {hotel.logoUrl ? (
                            <img src={hotel.logoUrl} alt="" className="w-full h-full object-contain" />
                        ) : (
                            hotel.name.slice(0, 2)
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-black text-neutral-900 uppercase tracking-tight">
                          {hotel.name}
                        </p>
                        <p className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                          /{hotel.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      <MapPin className="w-3.5 h-3.5 text-red-500/30" />
                      {hotel.location || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                      <Phone className="w-3.5 h-3.5 text-blue-500/30" />
                      {hotel.phone || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="px-2.5 py-1 rounded-[4px] bg-green-50 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-100">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end">
                        <HotelRowActions hotel={hotel} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
