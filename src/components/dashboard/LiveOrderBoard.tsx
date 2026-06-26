"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  Utensils,
  Loader2,
  ChevronRight,
  DollarSign,
  RotateCcw,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface Order {
  id: string;
  table_id: string;
  tableNumber?: string;
  status:
    | "pending"
    | "confirmed"
    | "preparing"
    | "served"
    | "completed"
    | "cancelled";
  payment_status?: string;
  order_type?: string;
  total_amount: string;
  created_at: string;
  items?: any[];
  transactionId?: string;
}

export default function LiveOrderBoard({
  initialOrders,
  hotelId,
}: {
  initialOrders: Order[];
  hotelId?: string;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("live-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: hotelId ? `hotel_id=eq.${hotelId}` : undefined },
        async (payload) => {
          if (payload.eventType === "INSERT") {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hotelId]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: Order["status"];
    }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );
    },
  });

  const refundMutation = useMutation({
    mutationFn: async ({ transactionId, reason }: { transactionId: string; reason: string }) => {
      const res = await fetch(`/api/transactions/${transactionId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) throw new Error("Failed to refund transaction");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["live-orders"] });
      setRefundOrderId(null);
      setRefundReason("");
    },
  });

  const verifyPaymentMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      if (!res.ok) throw new Error("Failed to verify payment");
      return res.json();
    },
    onSuccess: (updatedOrder) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );
    },
  });

  const getNextStatus = (status: Order["status"]): Order["status"] | null => {
    switch (status) {
      case "pending":
        return "confirmed";
      case "confirmed":
        return "preparing";
      case "preparing":
        return "served";
      case "served":
        return "completed";
      default:
        return null;
    }
  };

  const getStatusActionLabel = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Confirm Order";
      case "confirmed":
        return "Start Preparing";
      case "preparing":
        return "Mark as Served";
      case "served":
        return "Complete & Close";
      default:
        return "Done";
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "confirmed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "preparing":
        return "bg-orange-50 text-orange-700 border-orange-200";
      case "served":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      default:
        return "bg-neutral-50 text-neutral-600 border-neutral-200";
    }
  };

  const needsPaymentVerification = (order: Order) =>
    order.payment_status === "unpaid" && order.order_type === "cash";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <AnimatePresence mode="popLayout">
        {orders
          .filter((o) => o.status !== "completed")
          .map((order) => {
            const nextStatus = getNextStatus(order.status);
            const isUpdating =
              updateStatusMutation.isPending &&
              updateStatusMutation.variables?.id === order.id;
            const needsPayment = needsPaymentVerification(order);
            const isVerifying =
              verifyPaymentMutation.isPending &&
              verifyPaymentMutation.variables?.id === order.id;

            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white border border-neutral-200 rounded-[6px] p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-neutral-50 rounded-xl flex items-center justify-center border border-neutral-100 group-hover:border-neutral-200 transition-colors">
                      <Utensils className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">
                        Table {order.tableNumber || "12"}
                      </h3>
                      <p className="text-sm font-black text-neutral-900 leading-none">
                        #{order.id.slice(0, 6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div
                      className={cn(
                        "px-2.5 py-1 rounded-[6px] text-[10px] font-black uppercase tracking-widest border",
                        getStatusColor(order.status),
                      )}
                    >
                      {order.status}
                    </div>
                    {order.order_type === "cash" && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-neutral-400">
                        Cash
                      </span>
                    )}
                    {order.payment_status === "paid" && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-green-600">
                        Paid
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Placed{" "}
                      {new Date(order.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="p-4 bg-neutral-50 rounded-[6px] border border-neutral-100 flex justify-between items-center group-hover:bg-white group-hover:border-neutral-200 transition-all">
                    <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest">
                      Amount
                    </span>
                    <span className="text-sm font-black text-neutral-900">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-neutral-100 space-y-2">
                  {order.payment_status === "paid" && order.status !== "completed" && (
                    <button
                      onClick={() => setRefundOrderId(order.id)}
                      className="w-full bg-red-50 text-red-600 border border-red-200 font-black py-2.5 rounded-[6px] hover:bg-red-100 transition-all flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Refund
                    </button>
                  )}
                  {needsPayment && (
                    <button
                      onClick={() => verifyPaymentMutation.mutate({ id: order.id })}
                      disabled={isVerifying}
                      className="w-full bg-green-600 text-white font-black py-3 rounded-[6px] hover:bg-green-700 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest disabled:opacity-50 shadow-lg"
                    >
                      {isVerifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          Verify Payment
                        </>
                      )}
                    </button>
                  )}
                  {nextStatus && !needsPayment && (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: order.id,
                          status: nextStatus,
                        })
                      }
                      disabled={isUpdating}
                      className="w-full bg-neutral-900 text-white font-black py-3.5 rounded-[6px] hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-neutral-200"
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
                  )}
                  {!nextStatus && !needsPayment && (
                    <div className="flex items-center justify-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest py-3 bg-green-50 rounded-xl border border-green-100">
                      <CheckCircle2 className="w-4 h-4" />
                      Order Completed
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {orders.filter((o) => o.status !== "completed").length === 0 && (
        <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 bg-white border-2 border-dashed border-neutral-200 rounded-[6px]">
          <div className="w-16 h-16 bg-neutral-50 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-neutral-200" />
          </div>
          <p className="text-neutral-400 font-bold uppercase tracking-widest text-xs">
            All caught up! No active orders.
          </p>
        </div>
      )}

      {/* Refund Modal */}
      {refundOrderId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-neutral-900 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[4px] overflow-hidden">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">
                  Refund Order
                </h3>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                  #{refundOrderId.slice(0, 6)}
                </p>
              </div>
              <button
                onClick={() => {
                  setRefundOrderId(null);
                  setRefundReason("");
                }}
                className="p-1 hover:bg-neutral-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-neutral-900" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-2">
                  Reason
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Why refund?"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-black resize-none h-24"
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    const order = orders.find((o) => o.id === refundOrderId);
                    if (!order || !order.transactionId) return;
                    refundMutation.mutate({
                      transactionId: order.transactionId,
                      reason: refundReason || "No reason given",
                    });
                  }}
                  disabled={refundMutation.isPending || !refundReason.trim()}
                  className="w-full bg-red-600 text-white py-4 text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {refundMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Refund
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setRefundOrderId(null);
                    setRefundReason("");
                  }}
                  className="w-full py-4 border border-neutral-200 text-neutral-400 text-[10px] font-black uppercase tracking-widest hover:text-neutral-900 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
