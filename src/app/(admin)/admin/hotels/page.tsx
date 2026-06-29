"use client";

import React, { useState, useEffect } from "react";
import { Search, MapPin, Phone, Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import {
  OnboardHotelButton,
  HotelRowActions,
} from "@/components/admin/HotelActions";
import { useToastStore } from "@/lib/toast-store";

interface Hotel {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  location: string | null;
  phone: string | null;
  vatNumber: string | null;
  status: string;
  settings: { vatRate: number; serviceChargeRate: number } | undefined;
}

export default function HotelDirectoryPage() {
  const [search, setSearch] = useState("");
  const [allHotels, setAllHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPending, setShowPending] = useState(false);

  const fetchHotels = () => {
    setLoading(true);
    fetch("/api/hotels")
      .then((r) => r.json())
      .then((data) => {
        setAllHotels(
          data.map((h: any) => ({
            ...h,
            status: h.status || "approved",
            settings: h.settings as { vatRate: number; serviceChargeRate: number } | undefined,
          })),
        );
        setLoading(false);
      });
  };

  useEffect(() => { fetchHotels(); }, []);

  const { addToast } = useToastStore();

  const handleStatusUpdate = async (hotelId: string, status: string) => {
    setActionLoading(hotelId);
    try {
      const res = await fetch(`/api/hotels/${hotelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update status");
      }
      addToast(`Hotel status updated to ${status}`, "success");
      fetchHotels();
    } catch (err: any) {
      addToast(err.message, "error");
    } finally {
      setActionLoading(null);
    }
  };

  const pendingCount = allHotels.filter((h) => h.status === "pending").length;

  const filtered = (showPending ? allHotels.filter((h) => h.status === "pending") : allHotels).filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      (h.location && h.location.toLowerCase().includes(search.toLowerCase())) ||
      h.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-green-500/10 text-green-500 text-[8px] font-black uppercase tracking-widest border border-green-500/20">
            <CheckCircle className="w-2.5 h-2.5" />
            Approved
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase tracking-widest border border-amber-500/20">
            <Clock className="w-2.5 h-2.5" />
            Pending
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-red-500/10 text-red-500 text-[8px] font-black uppercase tracking-widest border border-red-500/20">
            <XCircle className="w-2.5 h-2.5" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-[4px] bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest border border-primary/20">
            {status}
          </span>
        );
    }
  };

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
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <button
              onClick={() => setShowPending(!showPending)}
              className={`flex items-center gap-2 px-5 py-3 rounded-[6px] text-[10px] font-black uppercase tracking-widest transition-all ${
                showPending
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending ({pendingCount})
            </button>
          )}
          <OnboardHotelButton />
        </div>
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

      <div className="bg-card rounded-[6px] shadow-sm dark:shadow-black/10 overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/30 mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <Search className="w-8 h-8 text-muted mx-auto" />
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                {showPending ? "No pending hotels" : "No results found"}
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
                      <div className="flex flex-col gap-2">
                        {statusBadge(hotel.status)}
                        {hotel.status === "pending" && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleStatusUpdate(hotel.id, "approved")}
                              disabled={actionLoading === hotel.id}
                              className="px-2 py-1 rounded-[3px] bg-green-500/10 text-green-500 text-[7px] font-black uppercase tracking-widest border border-green-500/20 hover:bg-green-500/20 transition-all disabled:opacity-50"
                            >
                              {actionLoading === hotel.id ? "..." : "Approve"}
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(hotel.id, "rejected")}
                              disabled={actionLoading === hotel.id}
                              className="px-2 py-1 rounded-[3px] bg-red-500/10 text-red-500 text-[7px] font-black uppercase tracking-widest border border-red-500/20 hover:bg-red-500/20 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {hotel.status === "rejected" && (
                          <button
                            onClick={() => handleStatusUpdate(hotel.id, "pending")}
                            disabled={actionLoading === hotel.id}
                            className="px-2 py-1 rounded-[3px] bg-amber-500/10 text-amber-500 text-[7px] font-black uppercase tracking-widest border border-amber-500/20 hover:bg-amber-500/20 transition-all disabled:opacity-50 self-start"
                          >
                            {actionLoading === hotel.id ? "..." : "Reconsider"}
                          </button>
                        )}
                      </div>
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
