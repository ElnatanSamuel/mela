"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Coins, Smartphone, Banknote, Loader2 } from "lucide-react";

interface TipSummaryData {
  todayTotal: number;
  count: number;
  cashTotal: number;
  digitalTotal: number;
}

export default function TipSummary({ hotelId }: { hotelId: string }) {
  const { data, isLoading } = useQuery<TipSummaryData>({
    queryKey: ["tip-summary", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/tips/summary?hotelId=${hotelId}`);
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-[6px] p-5 shadow-sm">
        <div className="flex items-center justify-center h-24">
          <Loader2 className="w-5 h-5 animate-spin text-neutral-300" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-neutral-200 rounded-[6px] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-neutral-400" />
          <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
            Today's Tips
          </h4>
        </div>
        <span className="text-[9px] font-bold text-neutral-400">
          {data?.count || 0} tips
        </span>
      </div>

      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-black text-neutral-900 tracking-tighter">
          {formatCurrency(data?.todayTotal || 0)}
        </span>
        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest">
          Total
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center border border-green-100">
            <Banknote className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-900">
              {formatCurrency(data?.cashTotal || 0)}
            </p>
            <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
              Cash
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-black text-neutral-900">
              {formatCurrency(data?.digitalTotal || 0)}
            </p>
            <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
              Digital
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
