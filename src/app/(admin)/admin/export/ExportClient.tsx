"use client";

import React, { useState } from "react";
import { Download, Calendar, FileSpreadsheet, Building2 } from "lucide-react";

interface ExportClientProps {
  isPlatformAdmin: boolean;
  allHotels: { id: string; name: string }[];
  defaultHotelId: string;
}

export default function ExportClient({ isPlatformAdmin, allHotels, defaultHotelId }: ExportClientProps) {
  const [type, setType] = useState("orders");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [hotelId, setHotelId] = useState(defaultHotelId);

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set("type", type);
    if (hotelId) params.set("hotelId", hotelId);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    window.location.href = `/api/export?${params.toString()}`;
  };

  return (
    <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
            Export
          </h2>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Download CSV files
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
          <Calendar className="w-3.5 h-3.5" />
          Filter by date
        </div>
      </div>

      <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm space-y-8">
        <div className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Type
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground bg-card text-foreground"
            >
              <option value="orders">Orders</option>
              <option value="revenue">Revenue</option>
              <option value="audit">Audit Logs</option>
            </select>
          </div>

          {isPlatformAdmin && (
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5" />
                Hotel
              </label>
              <select
                value={hotelId}
                onChange={(e) => setHotelId(e.target.value)}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground bg-card text-foreground"
              >
                {allHotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                From
              </label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                To
              </label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="w-full py-5 bg-neutral-900 text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>
    </div>
  );
}
