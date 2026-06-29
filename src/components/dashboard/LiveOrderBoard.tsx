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
  role,
}: {
  initialOrders: Order[];
  hotelId?: string;
  role?: string;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [confirmPaymentOrder, setConfirmPaymentOrder] = useState<Order | null>(null);
  const [paymentOrderItems, setPaymentOrderItems] = useState<any[] | null>(null);
  const [paymentOrderDetails, setPaymentOrderDetails] = useState<any | null>(null);
  const [isFetchingItems, setIsFetchingItems] = useState(false);
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
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const needsPaymentVerification = (order: Order) =>
    order.payment_status === "unpaid";

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
                className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10 hover:shadow-md transition-all flex flex-col h-full group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted rounded-xl flex items-center justify-center border border-border group-hover:border-muted-foreground/20 transition-colors">
                       <Utensils className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">
                        Table {order.tableNumber || "12"}
                      </h3>
                      <p className="text-sm font-black text-foreground leading-none">
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
                      <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                        Cash
                      </span>
                    )}
                    {order.order_type === "digital" && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-blue-600">
                        Chapa
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
                  <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Placed{" "}
                      {new Date(order.created_at).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="p-4 bg-muted rounded-[6px] border border-border flex justify-between items-center group-hover:bg-card group-hover:border-muted-foreground/20 transition-all">
                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      Amount
                    </span>
                    <span className="text-sm font-black text-foreground">
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-5 border-t border-border space-y-2">
                  {role !== "waiter" && order.payment_status === "paid" && order.status !== "completed" && (
                    <button
                      onClick={() => setRefundOrderId(order.id)}
                      className="w-full bg-destructive/10 text-destructive border border-destructive/20 font-black py-2.5 rounded-[6px] hover:bg-destructive/20 transition-all flex items-center justify-center gap-2 text-[9px] uppercase tracking-widest"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Refund
                    </button>
                  )}
                  {role !== "waiter" && needsPayment && (
                    <button
                      onClick={async () => {
                        setConfirmPaymentOrder(order);
                        setIsFetchingItems(true);
                        try {
                          const res = await fetch(`/api/guest/orders/${order.id}`);
                          const data = await res.json();
                          setPaymentOrderItems(data.items || []);
                          setPaymentOrderDetails(data);
                        } catch {
                          setPaymentOrderItems([]);
                          setPaymentOrderDetails(null);
                        }
                        setIsFetchingItems(false);
                      }}
                      disabled={isVerifying}
                      className="w-full bg-green-600 text-white font-black py-3 rounded-[6px] hover:bg-green-700 transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest disabled:opacity-50 shadow-lg"
                    >
                      {isVerifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          {order.order_type === "digital" ? "Confirm Payment" : "Verify Payment"}
                        </>
                      )}
                    </button>
                  )}
                  {role !== "waiter" && role !== "owner" && role !== "manager" && nextStatus && !needsPayment && (
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: order.id,
                          status: nextStatus,
                        })
                      }
                      disabled={isUpdating}
                      className="w-full bg-primary text-primary-foreground font-black py-3 rounded-[6px] hover:bg-primary/90 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest disabled:opacity-50 shadow-lg"
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
                  {role !== "waiter" && role !== "owner" && role !== "manager" && !nextStatus && !needsPayment && (
                    <div className="flex items-center justify-center gap-2 text-green-600 text-[10px] font-black uppercase tracking-widest py-3 bg-green-50 rounded-xl border border-green-100">
                      <CheckCircle2 className="w-4 h-4" />
                      Order Completed
                    </div>
                  )}
                  {role === "waiter" && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest py-3">
                      {order.status === "served" ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-500" /> Ready to serve</>
                      ) : (
                        <>Status: {order.status}</>
                      )}
                    </div>
                  )}
                  {(role === "owner" || role === "manager") && (
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-[10px] font-black uppercase tracking-widest py-3">
                      {order.status === "completed" ? (
                        <><CheckCircle2 className="w-4 h-4 text-green-500" /> Completed</>
                      ) : (
                        <>Status: {order.status}</>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>

      {orders.filter((o) => o.status !== "completed").length === 0 && (
        <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4 bg-card border-2 border-dashed border-border rounded-[6px]">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">
            All caught up! No active orders.
          </p>
        </div>
      )}

      {/* Refund Modal */}
      {refundOrderId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border-2 border-border w-full max-w-md shadow-xl rounded-[6px] overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted">
              <div className="space-y-0.5">
                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
                  Refund Order
                </h3>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                  #{refundOrderId.slice(0, 6)}
                </p>
              </div>
              <button
                onClick={() => {
                  setRefundOrderId(null);
                  setRefundReason("");
                }}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
                  Reason
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Why refund?"
                  className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground resize-none h-24 text-foreground"
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
                  className="w-full py-4 border border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Payment Receipt Modal */}
      {confirmPaymentOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setConfirmPaymentOrder(null); setPaymentOrderItems(null); }}>
          <div className="bg-white w-full max-w-lg shadow-xl rounded-[6px] overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-stone-200 flex items-center justify-between bg-stone-50 shrink-0">
              <div>
                <h3 className="text-sm font-black text-stone-900 uppercase tracking-widest">
                  {confirmPaymentOrder.order_type === "digital" ? "Confirm Payment" : "Verify Payment"}
                </h3>
                <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">
                  Table {confirmPaymentOrder.tableNumber || "—"} &middot; #{confirmPaymentOrder.id.slice(0, 6)}
                </p>
              </div>
              <button
                onClick={() => { setConfirmPaymentOrder(null); setPaymentOrderItems(null); }}
                className="p-1 hover:bg-stone-200 rounded transition-colors"
              >
                <X className="w-4 h-4 text-stone-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isFetchingItems ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 text-stone-300 animate-spin" />
                </div>
              ) : paymentOrderItems && paymentOrderItems.length > 0 ? (
                <>
                  <div className="space-y-3">
                    <div className="flex justify-between text-[9px] text-stone-400 font-bold uppercase tracking-widest">
                      <span>Item</span>
                      <div className="flex gap-6">
                        <span>Qty</span>
                        <span>Total</span>
                      </div>
                    </div>
                    {paymentOrderItems.map((item: any, i: number) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs">
                          <span className="text-stone-900 font-bold flex-1 truncate mr-2">{item.name}</span>
                          <span className="text-stone-400 w-8 text-center">{item.quantity}</span>
                          <span className="text-stone-900 font-bold w-16 text-right">
                            {(parseFloat(item.unitPrice) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                        {item.modifiers?.map((m: any, j: number) => (
                          <div key={j} className="flex justify-between text-[10px] text-stone-400 pl-2 ml-0">
                            <span>+ {m.name}</span>
                            <span>{m.priceDelta > 0 ? `+${m.priceDelta}` : ""}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-stone-200" />

                  {paymentOrderDetails?.order && (
                    <div className="space-y-2">
                      {(() => {
                        const o = paymentOrderDetails.order;
                        const sub = paymentOrderItems.reduce((sum: number, item: any) => {
                          const base = parseFloat(item.unitPrice) * item.quantity;
                          const mods = (item.modifiers || []).reduce((s: number, m: any) => s + m.priceDelta, 0) * item.quantity;
                          return sum + base + mods;
                        }, 0);
                        const vat = parseFloat(o.vatAmount || "0");
                        const svc = parseFloat(o.serviceCharge || "0");
                        const disc = parseFloat(o.discountAmount || "0");
                        const tip = parseFloat(o.tipAmount || "0");
                        return (
                          <>
                            <div className="flex justify-between text-[10px] text-stone-400">
                              <span>Subtotal</span>
                              <span>{sub.toLocaleString()}</span>
                            </div>
                            {vat > 0 && (
                              <div className="flex justify-between text-[10px] text-stone-400">
                                <span>VAT</span>
                                <span>{vat.toLocaleString()}</span>
                              </div>
                            )}
                            {svc > 0 && (
                              <div className="flex justify-between text-[10px] text-stone-400">
                                <span>Service</span>
                                <span>{svc.toLocaleString()}</span>
                              </div>
                            )}
                            {disc > 0 && (
                              <div className="flex justify-between text-[10px] text-green-600">
                                <span>Discount</span>
                                <span>-{disc.toLocaleString()}</span>
                              </div>
                            )}
                            {tip > 0 && (
                              <div className="flex justify-between text-[10px] text-stone-400">
                                <span>Tip</span>
                                <span>{tip.toLocaleString()}</span>
                              </div>
                            )}
                            <div className="border-t-2 border-stone-900 pt-2 flex justify-between">
                              <span className="text-sm font-black text-stone-900 uppercase">Total</span>
                              <span className="text-sm font-black text-stone-900">{parseFloat(o.totalAmount).toLocaleString()} ETB</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-10 text-xs text-stone-400">
                  No items found
                </div>
              )}
            </div>

            <div className="p-6 border-t border-stone-200 space-y-2 shrink-0">
              <button
                onClick={() => {
                  verifyPaymentMutation.mutate({ id: confirmPaymentOrder.id });
                  setConfirmPaymentOrder(null);
                  setPaymentOrderItems(null);
                }}
                disabled={verifyPaymentMutation.isPending || isFetchingItems}
                className="w-full bg-green-600 text-white py-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifyPaymentMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    {confirmPaymentOrder.order_type === "digital" ? "Confirm Payment" : "Mark as Paid"}
                  </>
                )}
              </button>
              <button
                onClick={() => { setConfirmPaymentOrder(null); setPaymentOrderItems(null); }}
                className="w-full py-4 border border-stone-200 text-stone-400 text-[10px] font-black uppercase tracking-widest hover:text-stone-900 transition-all rounded-[6px]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
