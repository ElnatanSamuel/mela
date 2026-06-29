"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  ChefHat,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Volume2,
  VolumeX,
  Lock,
  AlertCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Hotel {
  id: string;
  name: string;
  slug: string;
}

interface OrderItem {
  menuItemId: string;
  quantity: number;
  name?: string;
}

interface Order {
  id: string;
  table_id: string;
  tableNumber?: string;
  status: "pending" | "confirmed" | "preparing" | "served" | "completed" | "cancelled";
  total_amount: string;
  created_at: string;
  items?: OrderItem[];
}

function TimeAgo({ time, isNew }: { time: string; isNew?: boolean }) {
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
  return (
    <span className={cn("tabular-nums font-mono text-xs font-bold transition-colors", isNew && "animate-pulse", mins >= 10 ? "text-red-500" : mins >= 5 ? "text-orange-500" : "text-neutral-500")}>
      {elapsed}
    </span>
  );
}

export default function KitchenTokenPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<"hotel" | "pin" | "display">("hotel");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [hotelData, setHotelData] = useState<{ hotelId: string; hotelName: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevOrderCount = React.useRef(orders.length);

  const todayStart = useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isToday = useCallback((dateStr: string) => {
    return new Date(dateStr).getTime() >= todayStart().getTime();
  }, [todayStart]);

  const trimColumn = useCallback((items: Order[]) => {
    return items.slice(0, 15);
  }, []);

  const mergeOrder = useCallback((prev: Order[], updated: Order) => {
    return prev.map((o) => (o.id === updated.id ? updated : o));
  }, []);

  // Auto-dismiss Ready orders after 2 minutes
  useEffect(() => {
    const id = setInterval(() => {
      setOrders((prev) => {
        const now = Date.now();
        return prev.filter((o) => {
          if (o.status !== "served") return true;
          return now - new Date(o.created_at).getTime() < 120000;
        });
      });
    }, 10000);
    return () => clearInterval(id);
  }, []);

  // Step 1: Load hotel
  const { data: hotel, isLoading: hotelLoading, error: hotelError } = useQuery<Hotel>({
    queryKey: ["kitchen-hotel", token],
    queryFn: async () => {
      let res = await fetch(`/api/hotels/lookup?token=${token}`);
      if (res.ok) return res.json();
      throw new Error("Hotel not found");
    },
    enabled: !!token,
  });

  // Step 2: Verify PIN + create session
  const verifyPinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, pin, type: "kitchen" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid PIN");
      return data;
    },
    onSuccess: (data) => {
      setHotelData({ hotelId: data.hotelId, hotelName: data.hotelName });
      setStep("display");
      setPinError("");
    },
    onError: (err: Error) => {
      setPinError(err.message);
      setPin("");
    },
  });

  // When hotel loads, go to PIN step
  useEffect(() => {
    if (hotel && step === "hotel") setStep("pin");
  }, [hotel, step]);

  // Step 3: Fetch orders
  useEffect(() => {
    if (!hotelData) return;
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?hotelId=${hotelData.hotelId}&active=true`);
        if (res.ok) {
          const all = await res.json();
          setOrders(all.filter((o: Order) => isToday(o.created_at)));
        }
      } catch {}
    };
    fetchOrders();
    const id = setInterval(fetchOrders, 30000);
    return () => clearInterval(id);
  }, [hotelData, isToday]);

  // Realtime
  useEffect(() => {
    if (!hotelData) return;
    const channel = supabase
      .channel(`kitchen-${hotelData.hotelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `hotel_id=eq.${hotelData.hotelId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newOrder = payload.new as Order;
          if (!isToday(newOrder.created_at)) return;
          setOrders((prev) => trimColumn([newOrder, ...prev]));
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
          setOrders((prev) => mergeOrder(prev, payload.new as Order));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelData, soundEnabled, isToday, trimColumn, mergeOrder]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || "Failed");
      }
      return res.json();
    },
    onSuccess: (updated) => setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o))),
  });

  const getNextStatus = (s: string) => s === "pending" || s === "confirmed" ? "preparing" : s === "preparing" ? "served" : null;
  const getButtonLabel = (s: string) => s === "pending" || s === "confirmed" ? "Start" : s === "preparing" ? "Ready" : "";
  const getButtonColor = (s: string) => s === "pending" || s === "confirmed" ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" : "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20";

  // --- Loading ---
  if (hotelLoading || step === "hotel") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // --- Not found ---
  if (hotelError || !hotel) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Link Invalid</h2>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">This kitchen link is invalid or revoked</p>
        </div>
      </div>
    );
  }

  // --- PIN Entry ---
  if (step === "pin") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-black text-white uppercase tracking-tight">{hotel.name}</h1>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest font-bold">Kitchen Display</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500 block mb-2">Enter PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 4) verifyPinMutation.mutate(); }}
                placeholder="Enter kitchen PIN"
                maxLength={6}
                autoFocus
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 tracking-[0.5em] font-mono text-center text-lg"
              />
            </div>

            {pinError && <p className="text-xs font-bold text-red-500 text-center">{pinError}</p>}

            <button
              onClick={() => verifyPinMutation.mutate()}
              disabled={pin.length < 4 || verifyPinMutation.isPending}
              className="w-full bg-orange-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {verifyPinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // --- Kitchen Display ---
  const newOrders = orders.filter((o) => o.status === "pending" || o.status === "confirmed");
  const preparing = orders.filter((o) => o.status === "preparing");
  const ready = orders.filter((o) => o.status === "served");

  const columns = [
    {
      label: "New",
      orders: newOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
      color: "text-orange-500",
      dot: "bg-orange-500",
      bg: "bg-orange-500/5",
      border: "border-orange-500/10",
      showTimer: true,
    },
    {
      label: "Cooking",
      orders: preparing.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      color: "text-blue-500",
      dot: "bg-blue-500",
      bg: "bg-blue-500/5",
      border: "border-blue-500/10",
      showTimer: true,
    },
    {
      label: "Ready",
      orders: ready.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
      color: "text-green-500",
      dot: "bg-green-500",
      bg: "bg-green-500/5",
      border: "border-green-500/10",
      showTimer: false,
    },
  ];

  const isLessThan20s = (time: string) => Date.now() - new Date(time).getTime() < 20000;

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight text-white">{hotelData?.hotelName}</h1>
            <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">Kitchen Display</p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-neutral-500 bg-neutral-800 px-2 py-1 rounded-md ml-2">
            {newOrders.length + preparing.length + ready.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-colors", soundEnabled ? "bg-orange-500/10 text-orange-500" : "bg-neutral-800 text-neutral-500")}>
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 flex gap-3 p-3 overflow-x-auto">
        {columns.map((col) => (
          <div key={col.label} className="flex-1 min-w-[300px] flex flex-col">
            <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-lg mb-3", col.bg, "border", col.border)}>
              <div className={cn("w-2 h-2 rounded-full", col.dot)} />
              <span className={cn("text-xs font-black uppercase tracking-widest", col.color)}>{col.label}</span>
              <span className="ml-auto text-xs font-black text-neutral-600">{col.orders.length}</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {col.orders.map((order) => {
                  const next = getNextStatus(order.status);
                  const isUpdating = updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id;
                  const isNew = col.label === "New" && isLessThan20s(order.created_at);
                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95, x: -20 }}
                      animate={{ opacity: 1, scale: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95, x: 50 }}
                      className={cn(
                        "bg-neutral-900 rounded-lg border border-neutral-800 shadow-sm",
                        isNew && "border-l-2 border-l-orange-500"
                      )}
                    >
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-base font-black text-white", isNew && "animate-pulse")}>
                              Table {order.tableNumber || "?"}
                            </span>
                          </div>
                          {col.showTimer && <TimeAgo time={order.created_at} isNew={isNew} />}
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {order.items?.map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded text-[11px] font-bold">
                              <span className="text-orange-500">{item.quantity}x</span>
                              {item.name || `Item ${idx + 1}`}
                            </span>
                          ))}
                          {!order.items?.length && (
                            <span className="text-[11px] text-neutral-600 italic">Loading...</span>
                          )}
                        </div>

                        {next && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: next })}
                            disabled={isUpdating}
                            className={cn(
                              "w-full py-2 rounded-lg text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]",
                              getButtonColor(order.status)
                            )}
                          >
                            {isUpdating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>{getButtonLabel(order.status)} <ChevronRight className="w-3.5 h-3.5" /></>
                            )}
                          </button>
                        )}
                        {order.status === "served" && (
                          <div className="flex items-center justify-center gap-1.5 text-green-500 text-[10px] font-black uppercase tracking-widest py-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {col.orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-4 h-4 text-neutral-700" />
                  </div>
                  <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                    {col.label === "New" ? "All clear" : "Empty"}
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
