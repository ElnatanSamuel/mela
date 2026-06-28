"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import {
  Clock,
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertCircle,
  Bell,
  Volume2,
  VolumeX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface OrderItem {
  menuItemId: string;
  quantity: number;
  name?: string;
  modifiers?: any[];
}

interface Order {
  id: string;
  table_id: string;
  tableNumber?: string;
  status: "pending" | "confirmed" | "preparing" | "served" | "completed" | "cancelled";
  total_amount: string;
  created_at: string;
  items?: OrderItem[];
  order_type?: string;
}

function TimeAgo({ time }: { time: string }) {
  const [elapsed, setElapsed] = useState("");

  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - new Date(time).getTime()) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [time]);

  const mins = parseInt(elapsed.split(":")[0]);
  const isUrgent = mins >= 10;
  const isWarning = mins >= 5;

  return (
    <span
      className={cn(
        "tabular-nums font-mono text-xs font-black",
        isUrgent ? "text-red-500" : isWarning ? "text-orange-500" : "text-neutral-400"
      )}
    >
      {elapsed}
    </span>
  );
}

export default function KitchenDisplay({ hotelId }: { hotelId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderCount = React.useRef(orders.length);

  useEffect(() => {
    const channel = supabase
      .channel(`kitchen-${hotelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `hotel_id=eq.${hotelId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
            if (soundEnabled) {
              try {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 800;
                gain.gain.value = 0.3;
                osc.start();
                osc.stop(ctx.currentTime + 0.15);
              } catch {}
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId, soundEnabled]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?hotelId=${hotelId}&active=true`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch {}
    };
    fetchOrders();
    const id = setInterval(fetchOrders, 15000);
    return () => clearInterval(id);
  }, [hotelId]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed to update order");
      }
      return res.json();
    },
    onSuccess: (updated) => {
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
    },
    onError: (error) => {
      console.error("Kitchen status update failed:", error.message);
      alert(`Update failed: ${error.message}`);
    },
  });

  const getNextStatus = (s: string): string | null => {
    const flow: Record<string, string> = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "served",
    };
    return flow[s] || null;
  };

  const getButtonLabel = (s: string): string => {
    const labels: Record<string, string> = {
      pending: "Accept",
      confirmed: "Start Cooking",
      preparing: "Ready to Serve",
    };
    return labels[s] || "";
  };

  const pending = orders.filter((o) => o.status === "pending");
  const confirmed = orders.filter((o) => o.status === "confirmed");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "served");

  const columns = [
    { label: "New Orders", orders: pending, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    { label: "Accepted", orders: confirmed, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Cooking", orders: preparing, color: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20" },
    { label: "Ready", orders: ready, color: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20" },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-black uppercase tracking-tight text-neutral-900 dark:text-white">
            Kitchen Display
          </h1>
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded-md">
            {pending.length + confirmed.length + preparing.length + ready.length} active
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "w-9 h-9 rounded-lg flex items-center justify-center transition-colors",
              soundEnabled
                ? "bg-orange-500/10 text-orange-500"
                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
            )}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {columns.map((col) => (
          <div key={col.label} className="flex-1 min-w-[280px] flex flex-col">
            {/* Column Header */}
            <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl mb-3", col.bg, "border", col.border)}>
              <div className={cn("w-2 h-2 rounded-full", col.color.replace("text-", "bg-"))} />
              <span className={cn("text-xs font-black uppercase tracking-widest", col.color)}>
                {col.label}
              </span>
              <span className="ml-auto text-xs font-black text-neutral-500">
                {col.orders.length}
              </span>
            </div>

            {/* Order Cards */}
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {col.orders
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map((order) => {
                    const next = getNextStatus(order.status);
                    const isUpdating =
                      updateStatusMutation.isPending &&
                      updateStatusMutation.variables?.id === order.id;

                    return (
                      <motion.div
                        key={order.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95, x: 50 }}
                        className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-4 shadow-sm"
                      >
                        {/* Order Header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-neutral-900 dark:text-white">
                              Table {order.tableNumber || "?"}
                            </span>
                            <span className="text-[8px] font-bold text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                              #{order.id.slice(0, 6)}
                            </span>
                          </div>
                          <TimeAgo time={order.created_at} />
                        </div>

                        {/* Items */}
                        <div className="space-y-1.5 mb-4">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <span className="text-xs font-black text-orange-500 w-5 text-right">
                                {item.quantity}x
                              </span>
                              <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 truncate">
                                {item.name || `Item ${idx + 1}`}
                              </span>
                            </div>
                          ))}
                          {!order.items?.length && (
                            <p className="text-xs text-neutral-400 italic">Loading items...</p>
                          )}
                        </div>

                        {/* Action Button */}
                        {next && (
                          <button
                            onClick={() =>
                              updateStatusMutation.mutate({ id: order.id, status: next })
                            }
                            disabled={isUpdating}
                            className={cn(
                              "w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                              order.status === "pending"
                                ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                                : order.status === "confirmed"
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                                : "bg-green-500 text-white shadow-lg shadow-green-500/20"
                            )}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                {getButtonLabel(order.status)}
                                <ChevronRight className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}

                        {order.status === "served" && (
                          <div className="flex items-center justify-center gap-2 text-green-500 text-xs font-black uppercase tracking-widest py-3">
                            <CheckCircle2 className="w-4 h-4" />
                            Ready to Serve
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
              </AnimatePresence>

              {col.orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-neutral-300 dark:text-neutral-600" />
                  </div>
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {col.label === "New Orders" ? "No new orders" : "Empty"}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
