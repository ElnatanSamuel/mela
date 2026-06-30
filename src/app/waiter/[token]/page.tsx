"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useToastStore } from "@/lib/toast-store";
import {
  Bell,
  BellOff,
  CheckCircle2,
  Loader2,
  ChevronRight,
  AlertCircle,
  Clock,
  Phone,
  Utensils,
  LayoutList,
  MessagesSquare,
  DollarSign,
  Hand,
  LogOut,
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
  order_type?: string;
  payment_status?: string;
  total_amount: string;
  created_at: string;
  items?: OrderItem[];
  customer_phone?: string;
}

interface ServiceRequest {
  id: string;
  tableId: string;
  type: "call_waiter" | "need_help";
  status: "pending" | "acknowledged" | "resolved";
  createdAt: string;
  tables?: { tableNumber: string };
}

interface StaffInfo {
  id: string;
  name: string;
  role: string;
}

function playBeep(freq: number = 600, duration: number = 0.1) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = freq;
    gain.gain.value = 0.2;
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

const tabs = [
  { id: "orders", label: "Orders", icon: LayoutList },
  { id: "requests", label: "Requests", icon: MessagesSquare },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function WaiterTokenPage() {
  const { token } = useParams<{ token: string }>();
  const addToast = useToastStore((s) => s.addToast);

  const [step, setStep] = useState<"hotel" | "pin" | "staff-pin" | "board">("hotel");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [staffPin, setStaffPin] = useState("");
  const [staffPinError, setStaffPinError] = useState("");
  const [staff, setStaff] = useState<StaffInfo | null>(null);
  const [hotelData, setHotelData] = useState<{ hotelId: string; hotelName: string } | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("orders");

  const todayStart = useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const isToday = useCallback((dateStr: string) => {
    return new Date(dateStr).getTime() >= todayStart().getTime();
  }, [todayStart]);

  const { data: hotel, isLoading: hotelLoading, error: hotelError } = useQuery<Hotel>({
    queryKey: ["waiter-hotel", token],
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
      setStep("staff-pin");
      setPinError("");
    },
    onError: (err: Error) => {
      setPinError(err.message);
      setPin("");
    },
  });

  const verifyStaffPinMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/staff/verify-staff-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hotelId: hotelData?.hotelId, pin: staffPin }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid PIN");
      return data as StaffInfo;
    },
    onSuccess: (data) => {
      setStaff(data);
      setStep("board");
      setStaffPinError("");
    },
    onError: (err: Error) => {
      setStaffPinError(err.message);
      setStaffPin("");
    },
  });

  useEffect(() => {
    if (hotel && step === "hotel") setStep("pin");
  }, [hotel, step]);

  // ─── Orders ────────────────────────────────────────────────

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

  useEffect(() => {
    if (!hotelData) return;
    const channel = supabase
      .channel(`waiter-orders-${hotelData.hotelId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `hotel_id=eq.${hotelData.hotelId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newOrder = payload.new as Order;
          if (!isToday(newOrder.created_at)) return;
          setOrders((prev) => {
            if (prev.find((o) => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
          if (soundEnabled) playBeep(800, 0.15);
        } else if (payload.eventType === "UPDATE") {
          const updated = payload.new as Order;
          setOrders((prev) =>
            prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
          );
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelData, isToday, soundEnabled]);

  // ─── Service Requests ──────────────────────────────────────

  useEffect(() => {
    if (!hotelData) return;
    const fetchRequests = async () => {
      try {
        const res = await fetch(`/api/service-requests?hotelId=${hotelData.hotelId}`);
        if (res.ok) {
          const data = await res.json();
          setRequests(data.filter((r: ServiceRequest) => r.status === "pending"));
        }
      } catch {}
    };
    fetchRequests();
    const id = setInterval(fetchRequests, 15000);
    return () => clearInterval(id);
  }, [hotelData]);

  useEffect(() => {
    if (!hotelData) return;
    const channel = supabase
      .channel(`waiter-requests-${hotelData.hotelId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "service_requests",
        filter: `hotel_id=eq.${hotelData.hotelId}`,
      }, (payload) => {
        if (payload.eventType === "INSERT") {
          const newReq = payload.new as ServiceRequest;
          if (newReq.status !== "pending") return;
          setRequests((prev) => {
            if (prev.find((r) => r.id === newReq.id)) return prev;
            return [newReq, ...prev];
          });
          if (soundEnabled) {
            playBeep(500, 0.15);
            setTimeout(() => playBeep(700, 0.12), 200);
          }
          addToast("New service request", "info");
        } else if (payload.eventType === "UPDATE") {
          const updated = payload.new as ServiceRequest;
          if (updated.status !== "pending") {
            setRequests((prev) => prev.filter((r) => r.id !== updated.id));
          } else {
            setRequests((prev) =>
              prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
            );
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [hotelData, soundEnabled, addToast]);

  // ─── Mutations ────────────────────────────────────────────

  const serveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "served" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async (id) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "served" } : o))
      );
    },
    onError: () => {
      if (hotelData) {
        fetch(`/api/orders?hotelId=${hotelData.hotelId}&active=true`)
          .then((r) => r.json())
          .then((all) => setOrders(all.filter((o: Order) => isToday(o.created_at))))
          .catch(() => {});
      }
    },
  });

  const prepareMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "preparing" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async (id) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status: "preparing" } : o))
      );
    },
  });

  const confirmCashMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async (id) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, payment_status: "paid" } : o))
      );
      addToast("Payment confirmed", "success");
    },
    onError: () => {
      if (hotelData) {
        fetch(`/api/orders?hotelId=${hotelData.hotelId}&active=true`)
          .then((r) => r.json())
          .then((all) => setOrders(all.filter((o: Order) => isToday(o.created_at))))
          .catch(() => {});
      }
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/service-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "acknowledged" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onMutate: async (id) => {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    },
  });

  // ─── Derived ──────────────────────────────────────────────

  const activeOrders = orders.filter(
    (o) => o.status !== "completed" && o.status !== "cancelled"
  );
  const pendingRequests = requests.filter((r) => r.status === "pending");

  // ─── Auth screens ─────────────────────────────────────────

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
          <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
            This waiter link is invalid or revoked
          </p>
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
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Waiter</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Enter PIN</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => { setPin(e.target.value); setPinError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 4) verifyPinMutation.mutate(); }}
                placeholder="Enter waiter PIN"
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

  if (step === "staff-pin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-black text-foreground uppercase tracking-tight">{hotel.name}</h1>
            <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest font-bold">Enter Your PIN</p>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Staff PIN</label>
              <input
                type="password"
                inputMode="numeric"
                value={staffPin}
                onChange={(e) => { setStaffPin(e.target.value.replace(/\D/g, "").slice(0, 6)); setStaffPinError(""); }}
                onKeyDown={(e) => { if (e.key === "Enter" && staffPin.length >= 4) verifyStaffPinMutation.mutate(); }}
                placeholder="Your 4-6 digit PIN"
                maxLength={6}
                autoFocus
                className="w-full bg-card border border-border rounded-xl py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-orange-500 tracking-[0.5em] font-mono text-center text-lg"
              />
            </div>
            {staffPinError && <p className="text-xs font-bold text-red-500 text-center">{staffPinError}</p>}
            <button
              onClick={() => verifyStaffPinMutation.mutate()}
              disabled={staffPin.length < 4 || verifyStaffPinMutation.isPending}
              className="w-full bg-orange-500 text-white py-3.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition-transform"
            >
              {verifyStaffPinMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Continue"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── Main view ────────────────────────────────────────────

  const requestTypeLabel = (t: string) =>
    t === "call_waiter" ? "Call Waiter" : "Need Help";

  const requestTypeIcon = (t: string) =>
    t === "call_waiter" ? Hand : AlertCircle;

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 bg-card border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-orange-500 rounded-[4px] flex items-center justify-center shrink-0">
              <Utensils className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black uppercase tracking-tight text-foreground truncate">
                {hotelData?.hotelName}
              </h1>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                {staff?.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={cn(
              "w-9 h-9 rounded-[6px] flex items-center justify-center transition-colors shrink-0",
              soundEnabled
                ? "bg-orange-500/10 text-orange-500"
                : "bg-muted text-muted-foreground"
            )}
          >
            {soundEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="shrink-0 flex border-b border-border bg-card">
        {tabs.map((tab) => {
          const count = tab.id === "orders" ? activeOrders.length : pendingRequests.length;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest transition-colors relative",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {count > 0 && (
                <span className="bg-orange-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-none">
                  {count > 99 ? "99+" : count}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "orders" && (
          <div className="p-3 space-y-2 max-w-lg mx-auto">
            <AnimatePresence mode="popLayout">
              {activeOrders.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-lg font-black text-foreground tracking-tight mb-1">All Clear</h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    No orders
                  </p>
                </motion.div>
              )}

              {activeOrders.map((order) => {
                const isNew = Date.now() - new Date(order.created_at).getTime() < 30000;
                const isServed = order.status === "served";
                const needsCashConfirm =
                  isServed &&
                  order.order_type === "cash" &&
                  order.payment_status !== "paid";
                const isPaid = isServed && order.payment_status === "paid";

                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "bg-card border border-border rounded-[6px] overflow-hidden",
                      isNew && !isServed && "border-l-2 border-l-orange-500"
                    )}
                  >
                    <div className="p-3.5">
                      {/* Row 1: Table + time + status */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-2xl font-black text-foreground tracking-tight",
                            isNew && !isServed && "animate-pulse"
                          )}>
                            #{order.tableNumber || "?"}
                          </span>
                          <span
                            className={cn(
                              "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-[3px]",
                              order.status === "pending" && "bg-yellow-500/10 text-yellow-600",
                              order.status === "confirmed" && "bg-blue-500/10 text-blue-600",
                              order.status === "preparing" && "bg-purple-500/10 text-purple-600",
                              isServed && "bg-green-500/10 text-green-600"
                            )}
                          >
                            {order.status === "pending"
                              ? "New"
                              : order.status === "confirmed"
                              ? "Confirmed"
                              : order.status === "preparing"
                              ? "Preparing"
                              : "Served"}
                          </span>
                          {isPaid && (
                            <span className="text-[8px] font-black uppercase tracking-widest bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded-[3px]">
                              Paid
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(order.created_at).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Row 2: Items */}
                      {order.items && order.items.length > 0 && (
                        <div className="space-y-0.5 mb-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-baseline gap-1.5 text-sm">
                              <span className="font-black text-orange-500 shrink-0 tabular-nums">{item.quantity}x</span>
                              <span className="text-foreground font-medium truncate">{item.name || `Item ${idx + 1}`}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {order.customer_phone && (
                        <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground mb-3">
                          <Phone className="w-3 h-3" />
                          {order.customer_phone}
                        </div>
                      )}

                      {/* Row 3: Actions */}
                      <div className="flex gap-2">
                        {order.status === "preparing" && (
                          <button
                            onClick={() => serveMutation.mutate(order.id)}
                            disabled={serveMutation.isPending}
                            className="flex-1 bg-green-500 text-white py-3 rounded-[6px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-transform shadow-sm"
                          >
                            {serveMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                Serve <CheckCircle2 className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                        {(order.status === "pending" || order.status === "confirmed") && (
                          <button
                            onClick={() => prepareMutation.mutate(order.id)}
                            disabled={prepareMutation.isPending}
                            className="flex-1 bg-orange-500 text-white py-3 rounded-[6px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-transform shadow-sm"
                          >
                            {prepareMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                Start <ChevronRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                        {needsCashConfirm && (
                          <button
                            onClick={() => confirmCashMutation.mutate(order.id)}
                            disabled={confirmCashMutation.isPending}
                            className="flex-1 bg-green-600 text-white py-3 rounded-[6px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-transform shadow-sm"
                          >
                            {confirmCashMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <>
                                Confirm Cash <DollarSign className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {activeTab === "requests" && (
          <div className="p-3 space-y-2 max-w-lg mx-auto">
            <AnimatePresence mode="popLayout">
              {pendingRequests.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-lg font-black text-foreground tracking-tight mb-1">No Requests</h2>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                    All guests are taken care of
                  </p>
                </motion.div>
              )}

              {pendingRequests.map((req) => {
                const Icon = requestTypeIcon(req.type);
                return (
                  <motion.div
                    key={req.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-border rounded-[6px] overflow-hidden"
                  >
                    <div className="p-3.5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-orange-500/10 rounded-[6px] flex items-center justify-center shrink-0">
                            <Icon className="w-5 h-5 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-foreground">
                              Table #{req.tables?.tableNumber || "?"}
                            </p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                              {requestTypeLabel(req.type)}
                            </p>
                          </div>
                        </div>
                        <span className="text-[9px] text-muted-foreground font-bold">
                          {new Date(req.createdAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <button
                        onClick={() => acknowledgeMutation.mutate(req.id)}
                        disabled={acknowledgeMutation.isPending}
                        className="w-full bg-orange-500 text-white py-2.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-[0.98] transition-transform"
                      >
                        {acknowledgeMutation.isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          "Acknowledge"
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
