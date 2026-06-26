"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  RotateCw,
  Power,
} from "lucide-react";
import { manageHotelSubscription } from "@/lib/actions";
import { formatDistanceToNow } from "date-fns";
import ActionMenu from "@/components/ui/ActionMenu";

// --- Types ---
interface Hotel {
  id: string;
  name: string;
  slug: string;
  subscriptionExpiresAt: string | null;
  location: string | null;
  logoUrl: string | null;
}

// --- Subscription Table Component ---
export function SubscriptionTable({ hotels }: { hotels: any[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filteredHotels = useMemo(() => {
    return hotels.filter(h => {
      const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) || h.slug.toLowerCase().includes(search.toLowerCase());
      const isExpired = h.subscriptionExpiresAt && new Date(h.subscriptionExpiresAt) < new Date();
      
      if (filter === "active") return matchesSearch && (!h.subscriptionExpiresAt || !isExpired);
      if (filter === "expired") return matchesSearch && (h.subscriptionExpiresAt && isExpired);
      return matchesSearch;
    });
  }, [hotels, search, filter]);

  return (
    <div className="overflow-x-auto rounded-[6px] border border-border">
      <div className="p-6 border-b border-border bg-card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-foreground transition-colors" />
            <input 
              type="text" 
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-muted dark:bg-muted border border-border rounded-[4px] py-3 pl-11 pr-4 text-xs font-bold text-foreground placeholder-muted-foreground focus:outline-none focus:border-foreground transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            {['all', 'active', 'expired'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`py-3 px-6 text-[10px] font-black uppercase tracking-widest rounded-[4px] transition-all ${
                  filter === f 
                    ? "bg-neutral-900 dark:bg-neutral-900 text-white" 
                    : "bg-card dark:bg-card text-muted-foreground border border-border hover:text-foreground hover:border-muted-foreground"
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hotel</th>
              <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Status</th>
              <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Expires</th>
              <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredHotels.map((hotel) => {
              const isExpired = hotel.subscriptionExpiresAt && new Date(hotel.subscriptionExpiresAt) < new Date();
              
              return (
                <tr key={hotel.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-muted rounded flex items-center justify-center overflow-hidden border border-border shrink-0">
                        {hotel.logoUrl ? (
                          <img src={hotel.logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-black text-foreground uppercase tracking-tight">{hotel.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-0.5">/{hotel.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {isExpired ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded text-[10px] font-bold uppercase tracking-widest">
                        <AlertCircle className="w-3 h-3" />
                        Expired
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 rounded text-[10px] font-bold uppercase tracking-widest">
                        <ShieldCheck className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {hotel.subscriptionExpiresAt ? new Date(hotel.subscriptionExpiresAt).toLocaleDateString() : "No Expiry"}
                        </p>
                        {hotel.subscriptionExpiresAt && (
                          <p className={`text-[10px] mt-0.5 ${isExpired ? "text-red-500" : "text-muted-foreground"}`}>
                            {isExpired ? "Expired " : "Due "} {formatDistanceToNow(new Date(hotel.subscriptionExpiresAt), { addSuffix: true })}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <ActionMenu
                      actions={[
                        { label: "Renew", icon: <RotateCw className="w-3.5 h-3.5" />, onClick: () => manageHotelSubscription(hotel.id, 'restart') },
                        { label: "Stop", icon: <Power className="w-3.5 h-3.5" />, onClick: () => manageHotelSubscription(hotel.id, 'terminate'), danger: true },
                      ]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
