"use client";

import React from "react";
import LiveOrderBoard from "@/components/dashboard/LiveOrderBoard";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export default function OrdersContent({ hotelId }: { hotelId: string }) {
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
        <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-black tracking-tight">
            Live Orders
          </h2>
          <p className="text-sm text-neutral-500">
            Track and manage active orders.
          </p>
        </div>
      </div>
      <LiveOrderBoard initialOrders={orders} hotelId={hotelId} />
    </div>
  );
}
