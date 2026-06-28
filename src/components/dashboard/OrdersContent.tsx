"use client";

import React from "react";
import LiveOrderBoard from "@/components/dashboard/LiveOrderBoard";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function OrdersContent({ hotelId, role }: { hotelId: string; role: string }) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["live-orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h2 className="text-lg font-black text-foreground tracking-tighter uppercase">Live Orders</h2>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Track and manage</p>
      </div>
      <LiveOrderBoard initialOrders={orders} hotelId={hotelId} role={role} />
    </div>
  );
}
