"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import { Clock, CheckCircle2, AlertCircle, Utensils, Loader2, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Order {
  id: string;
  table_id: string;
  tableNumber?: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'served' | 'completed' | 'cancelled';
  total_amount: string;
  created_at: string;
  items?: any[];
}

export default function LiveOrderBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("live-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;
            setOrders((prev) => 
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: Order['status'] }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      // Supabase Realtime will handle the state update, 
      // but we could also manually update the local state for even faster response.
    }
  });

  const getNextStatus = (status: Order['status']): Order['status'] | null => {
    switch (status) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'preparing';
      case 'preparing': return 'served';
      case 'served': return 'completed';
      default: return null;
    }
  };

  const getStatusActionLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Confirm Order';
      case 'confirmed': return 'Start Preparing';
      case 'preparing': return 'Mark as Served';
      case 'served': return 'Complete & Close';
      default: return 'Done';
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'confirmed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'preparing': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'served': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-neutral-500/10 text-neutral-500 border-neutral-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      <AnimatePresence mode="popLayout">
        {orders.filter(o => o.status !== 'completed').map((order) => {
          const nextStatus = getNextStatus(order.status);
          const isUpdating = updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id;

          return (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              className="bg-[#111111] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-all flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5">
                    <Utensils className="w-5 h-5 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Table {order.tableNumber || "12"}</h3>
                    <p className="text-sm font-bold text-white">#{order.id.slice(0, 6)}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  getStatusColor(order.status)
                )}>
                  {order.status}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-2 text-xs text-neutral-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Placed {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Amount</span>
                  <span className="text-sm font-black text-white">{formatCurrency(order.total_amount)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5">
                {nextStatus ? (
                  <button
                    onClick={() => updateStatusMutation.mutate({ id: order.id, status: nextStatus })}
                    disabled={isUpdating}
                    className="w-full bg-white text-black font-black py-3 rounded-xl hover:bg-neutral-200 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50"
                  >
                    {isUpdating ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {getStatusActionLabel(order.status)}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-green-500 text-[10px] font-black uppercase tracking-widest py-3">
                    <CheckCircle2 className="w-4 h-4" />
                    Order Completed
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
