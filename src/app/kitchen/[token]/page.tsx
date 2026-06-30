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
  Clock,
  Timer,
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

function OrderTime({ createdAt, showTimer }: { createdAt: string; showTimer: boolean }) {
  const time = new Date(createdAt);
  const hh = time.getHours().toString().padStart(2, "0");
  const mm = time.getMinutes().toString().padStart(2, "0");
  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = Math.floor((Date.now() - time.getTime()) / 1000);
      const m = Math.floor(diff / 60);
      const s = diff % 60;
      setElapsed(`${m}:${s.toString().padStart(2, "0")}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);
  const mins = parseInt(elapsed.split(":")[0]);
  if (!showTimer) {
    return (
      <span className="tabular-nums font-mono text-xs text-muted-foreground">
        {hh}:{mm}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="tabular-nums font-mono text-xs text-muted-foreground">
        {hh}:{mm}
      </span>
      <span className={cn(
        "tabular-nums font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-sm",
        mins >= 10 ? "bg-red-500/10 text-red-500" : mins >= 5 ? "bg-orange-500/10 text-orange-500" : "bg-muted text-muted-foreground"
      )}>
        {elapsed}
      </span>
    </div>
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
  const readyTimestamps = useRef<Map<string, number>>(new Map());

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

  const upsertOrder = useCallback((prev: Order[], updated: Partial<Order>) => {
    const idx = prev.findIndex((o) => o.id === updated.id);
    if (idx >= 0) {
      const next = [...prev];
      // Merge — preserve items and tableNumber from existing state
      // since Realtime payloads don't include joined data
      next[idx] = { ...next[idx], ...updated };
      return next;
    }
    return [updated as Order, ...prev];
  }, []);

  const mergeOrders = useCallback((prev: Order[], fetched: Order[]) => {
    let result = [...prev];
    for (const f of fetched) {
      const idx = result.findIndex((o) => o.id === f.id);
      if (idx >= 0) result[idx] = f;
      else result.push(f);
    }
    return result;
  }, []);

  // Auto-dismiss Ready orders using client-side timestamps
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      readyTimestamps.current.forEach((ts, orderId) => {
        if (now - ts >= 300000) {
          readyTimestamps.current.delete(orderId);
        }
      });
      setOrders((prev) =>
        prev.filter((o) => {
          if (o.status !== "served") return true;
          const ts = readyTimestamps.current.get(o.id);
          if (!ts) return false;
          return now - ts < 300000;
        })
      );
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Track when orders enter Ready (served) status
  const trackReady = useCallback((order: Order) => {
    if (order.status === "served" && !readyTimestamps.current.has(order.id)) {
      readyTimestamps.current.set(order.id, Date.now());
    }
  }, []);

  // On every orders state change, ensure ready orders are tracked
  useEffect(() => {
    orders.forEach(trackReady);
  }, [orders, trackReady]);

  const { data: hotel, isLoading: hotelLoading, error: hotelError } = useQuery<Hotel>({
    queryKey: ["kitchen-hotel", token],
    queryFn: async () => {
      let res = await fetch(`/api/hotels/lookup?token=${token}`);
      if (res.ok) return res.json();
      throw new Error("Hotel not found");
    },
    enabled: !!token,
  });

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

  useEffect(() => {
    if (hotel && step === "hotel") setStep("pin");
  }, [hotel, step]);

  useEffect(() => {
    if (!hotelData) return;
    const fetchOrders = async () => {
      try {
        const res = await fetch(`/api/orders?hotelId=${hotelData.hotelId}&active=true`);
        if (res.ok) {
          const all = await res.json();
          const todayOrders = all.filter((o: Order) => isToday(o.created_at));
          todayOrders.forEach(trackReady);
          setOrders((prev) => mergeOrders(prev, todayOrders));
        }
      } catch {}
    };
    fetchOrders();
    const id = setInterval(fetchOrders, 60000);
    return () => clearInterval(id);
  }, [hotelData, isToday, mergeOrders, trackReady]);

  useEffect(() => {
    if (!hotelData) return;
    const channel = supabase
      .channel(`kitchen-${hotelData.hotelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `hotel_id=eq.${hotelData.hotelId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newOrder = payload.new as Order;
          if (!isToday(newOrder.created_at)) return;
          trackReady(newOrder);
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
          const updated = payload.new as Order;
          trackReady(updated);
          setOrders((prev) => upsertOrder(prev, updated));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelData, soundEnabled, isToday, trimColumn, upsertOrder, trackReady]);

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
    onMutate: async ({ id, status }) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          const updated = { ...o, status: status as Order["status"] };
          trackReady(updated);
          return updated;
        })
      );
    },
    onError: () => {
      if (hotelData) {
        fetch(`/api/orders?hotelId=${hotelData.hotelId}&active=true`)
          .then((r) => r.json())
          .then((all) => {
            const todayOrders = all.filter((o: Order) => isToday(o.created_at));
            todayOrders.forEach(trackReady);
            setOrders((prev) => mergeOrders(prev, todayOrders));
          })
          .catch(() => {});
      }
    },
  });

  const getNextStatus = (s: string) => s === "pending" || s === "confirmed" ? "preparing" : s === "preparing" ? "served" : null;
  const getButtonLabel = (s: string) => s === "pending" || s === "confirmed" ? "Start" : s === "preparing" ? "Ready" : "";
  const getButtonColor = (s: string) =>
    s === "pending" || s === "confirmed"
      ? "bg-orange-500 hover:bg-orange-600 text-white"
      : "bg-green-500 hover:bg-green-600 text-white";

  if (hotelLoading || step === "hotel") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  if (hotelError || !hotel) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-foreground">Link Invalid</h2>
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">This kitchen link is invalid or revoked</p>
        </div>
      </div>
    );
  }

  if (step === "pin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-black text-foreground uppercase tracking-tight">{hotel.name}</h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Kitchen Display</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Enter PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 4) verifyPinMutation.mutate(); }}
                placeholder="Enter kitchen PIN"
                maxLength={6}
                autoFocus
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 tracking-[0.5em] font-mono text-center text-lg"
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-[4px] flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-tight text-foreground">{hotelData?.hotelName}</h1>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Kitchen Display</p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted px-2 py-0.5 rounded-[2px] ml-2">
            {newOrders.length + preparing.length + ready.length}
          </span>
        </div>
        <button onClick={() => setSoundEnabled(!soundEnabled)}
          className={cn("w-8 h-8 rounded-[4px] flex items-center justify-center transition-colors", soundEnabled ? "bg-orange-500/10 text-orange-500" : "bg-muted text-muted-foreground")}>
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* Columns */}
      <div className="flex-1 flex gap-3 p-3 overflow-x-auto">
        {columns.map((col) => (
          <div key={col.label} className="flex-1 min-w-[280px] flex flex-col">
            {/* Column header */}
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-[4px] mb-3", col.bg, "border", col.border)}>
              <div className={cn("w-2 h-2 rounded-full", col.dot)} />
              <span className={cn("text-[10px] font-black uppercase tracking-widest", col.color)}>{col.label}</span>
              <span className="ml-auto text-[10px] font-black text-muted-foreground">{col.orders.length}</span>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {col.orders.map((order) => {
                  const next = getNextStatus(order.status);
                  const isNew = col.label === "New" && Date.now() - new Date(order.created_at).getTime() < 20000;
                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "bg-card rounded-[4px] border border-border shadow-sm",
                        isNew && "border-l-2 border-l-orange-500"
                      )}
                    >
                      <div className="p-2.5">
                        {/* Row 1: Table number + Time */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={cn("text-lg font-black text-foreground tracking-tight", isNew && "animate-pulse")}>
                            #{order.tableNumber || "?"}
                          </span>
                          <OrderTime createdAt={order.created_at} showTimer={col.showTimer} />
                        </div>

                        {/* Row 2: Items as a list */}
                        <div className="space-y-0.5 mb-2">
                          {order.items?.map((item, idx) => (
                            <div key={idx} className="flex items-baseline gap-1.5 text-sm">
                              <span className="font-bold text-orange-500 shrink-0 tabular-nums">{item.quantity}x</span>
                              <span className="text-foreground font-medium truncate">{item.name || `Item ${idx + 1}`}</span>
                            </div>
                          ))}
                          {!order.items?.length && (
                            <span className="text-xs text-muted-foreground italic">Loading items...</span>
                          )}
                        </div>

                        {/* Row 3: Action button (New → Start, Cooking → Ready) */}
                        {next && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ id: order.id, status: next })}
                            className={cn(
                              "w-full py-1.5 rounded-[3px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 transition-all active:scale-[0.97]",
                              getButtonColor(order.status)
                            )}
                          >
                            {getButtonLabel(order.status)} <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {col.orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mb-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
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
