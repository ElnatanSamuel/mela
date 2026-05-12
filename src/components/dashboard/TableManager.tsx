"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, QrCode, Trash2, ExternalLink, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Table {
  id: string;
  tableNumber: string;
}

export default function TableManager({ hotelId }: { hotelId: string }) {
  const queryClient = useQueryClient();
  const [newTableNumber, setNewTableNumber] = useState("");
  const [viewingQR, setViewingQR] = useState<string | null>(null);

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () => fetch("/api/tables").then(res => res.json()),
  });

  const addTableMutation = useMutation({
    mutationFn: async (tableNumber: string) => {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setNewTableNumber("");
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-[#111111] p-6 rounded-2xl border border-white/5 shadow-xl">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Add New Table</h3>
          <p className="text-xs text-neutral-500">Create a new entry and generate a unique QR code.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="e.g., Table 10"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-all flex-1 md:w-48"
          />
          <button
            onClick={() => addTableMutation.mutate(newTableNumber)}
            disabled={!newTableNumber || addTableMutation.isPending}
            className="bg-white text-black px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-neutral-200 transition-all disabled:opacity-50"
          >
            {addTableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-[#111111] border border-white/5 rounded-2xl p-6 group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                <QrCode className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />
              </div>
              <button className="p-2 text-neutral-600 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">ID: {table.id.slice(0, 8)}</span>
              <h4 className="text-xl font-black text-white tracking-tight">{table.tableNumber}</h4>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => window.open(`/api/tables/${table.id}/qr`, '_blank')}
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Download className="w-3 h-3" />
                QR Code
              </button>
              <button 
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
