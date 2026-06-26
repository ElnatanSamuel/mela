"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, Phone, Loader2 } from "lucide-react";
import {
  OnboardHotelButton,
  HotelRowActions,
} from "@/components/admin/HotelActions";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  location: string | null;
  phone: string | null;
  vatNumber: string | null;
  settings: { vatRate: number; serviceChargeRate: number } | undefined;
}

export default function HotelDirectoryPage() {
  const [search, setSearch] = useState("");
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((data) => {
        setAllHotels(
          data.map((h: any) => ({
            ...h,
            settings: h.settings as { vatRate: number; serviceChargeRate: number } | undefined,
          })),
        );
        setLoading(false);
      });
  }, []);

  const filtered = allHotels.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.location && h.location.toLowerCase().includes(search.toLowerCase())) ||
      h.slug.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-foreground tracking-tighter uppercase">
            Hotel Directory
          </h2>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
            Manage all platform hotels
          </p>
        </div>
        <OnboardHotelButton />
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30 group-focus-within:text-foreground transition-colors" />
          <input
            type="text"
            placeholder="Search by name, location, or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-[6px] py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground transition-all placeholder:text-muted-foreground/30"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-[6px] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Search className="w-8 h-8 text-muted mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                No results found
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Hotel Info
                  </th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Location
                  </th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Contact
                  </th>
                  <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Status
                  </th>
                  <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((hotel) => (
                  <tr
                    key={hotel.id}
                    className="border-b border-border hover:bg-muted transition-colors"
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-neutral-900 text-white rounded-[6px] flex items-center justify-center font-black text-[10px] uppercase overflow-hidden border border-neutral-800">
                          {hotel.logoUrl ? (
                            <img
                              src={hotel.logoUrl}
                              alt=""
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            hotel.name.slice(0, 2)
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground uppercase tracking-tight">
                            {hotel.name}
                          </p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            /{hotel.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/30" />
                        {hotel.location || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Phone className="w-3.5 h-3.5 text-muted-foreground/30" />
                        {hotel.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="px-2.5 py-1 rounded-[4px] bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">
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
          )}
        </div>
      </div>
    </div>
  );
}
