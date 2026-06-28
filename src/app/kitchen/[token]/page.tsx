"use client";

import React, { useState, useEffect } from "react";
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
  return (
    <span className={cn("tabular-nums font-mono text-xs font-black", mins >= 10 ? "text-red-500" : mins >= 5 ? "text-orange-500" : "text-neutral-400")}>
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
        if (res.ok) setOrders(await res.json());
      } catch {}
    };
    fetchOrders();
    const id = setInterval(fetchOrders, 10000);
    return () => clearInterval(id);
  }, [hotelData]);

  // Realtime
  useEffect(() => {
    if (!hotelData) return;
    const channel = supabase
      .channel(`kitchen-${hotelData.hotelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `hotel_id=eq.${hotelData.hotelId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOrders((prev) => [payload.new as Order, ...prev]);
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
          setOrders((prev) => prev.map((o) => (o.id === (payload.new as Order).id ? (payload.new as Order) : o)));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelData, soundEnabled]);

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

  const getNextStatus = (s: string) => ({ pending: "confirmed", confirmed: "preparing", preparing: "served" }[s] || null);
  const getButtonLabel = (s: string) => ({ pending: "Accept", confirmed: "Start Cooking", preparing: "Ready to Serve" }[s] || "");

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
            {pending.length + confirmed.length + preparing.length + ready.length} active
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
      <div className="flex-1 flex gap-4 p-4 overflow-x-auto">
        {columns.map((col) => (
          <div key={col.label} className="flex-1 min-w-[280px] flex flex-col">
            <div className={cn("flex items-center gap-2 px-4 py-3 rounded-xl mb-3", col.bg, "border", col.border)}>
              <div className={cn("w-2 h-2 rounded-full", col.color.replace("text-", "bg-"))} />
              <span className={cn("text-xs font-black uppercase tracking-widest", col.color)}>{col.label}</span>
              <span className="ml-auto text-xs font-black text-neutral-500">{col.orders.length}</span>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              <AnimatePresence mode="popLayout">
                {col.orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()).map((order) => {
                  const next = getNextStatus(order.status);
                  const isUpdating = updateStatusMutation.isPending && updateStatusMutation.variables?.id === order.id;
                  return (
                    <motion.div key={order.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, x: 50 }}
                      className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-white">Table {order.tableNumber || "?"}</span>
                          <span className="text-[8px] font-bold text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded">#{order.id.slice(0, 6)}</span>
                        </div>
                        <TimeAgo time={order.created_at} />
                      </div>

                      <div className="space-y-1.5 mb-4">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="text-xs font-black text-orange-500 w-5 text-right">{item.quantity}x</span>
                            <span className="text-xs font-bold text-neutral-300 truncate">{item.name || `Item ${idx + 1}`}</span>
                          </div>
                        ))}
                        {!order.items?.length && <p className="text-xs text-neutral-600 italic">Loading items...</p>}
                      </div>

                      {next && (
                        <button onClick={() => updateStatusMutation.mutate({ id: order.id, status: next })} disabled={isUpdating}
                          className={cn("w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                            order.status === "pending" ? "bg-yellow-500 text-white shadow-lg shadow-yellow-500/20"
                              : order.status === "confirmed" ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                              : "bg-green-500 text-white shadow-lg shadow-green-500/20")}>
                          {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{getButtonLabel(order.status)}<ChevronRight className="w-4 h-4" /></>}
                        </button>
                      )}
                      {order.status === "served" && (
                        <div className="flex items-center justify-center gap-2 text-green-500 text-xs font-black uppercase tracking-widest py-3">
                          <CheckCircle2 className="w-4 h-4" /> Ready to Serve
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {col.orders.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center mb-3">
                    <CheckCircle2 className="w-5 h-5 text-neutral-700" />
                  </div>
                  <p className="text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
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
