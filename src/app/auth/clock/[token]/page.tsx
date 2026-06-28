"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  LogIn,
  LogOut,
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lock,
  Clock,
  Search,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StaffMember {
  userId: string;
  name: string | null;
  role: string;
}

interface Hotel {
  id: string;
  name: string;
  slug: string;
}

function LiveClock() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
      setDate(now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="text-center">
      <p className="text-5xl font-black tabular-nums tracking-tighter text-white">{time}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-500 mt-1">{date}</p>
    </div>
  );
}

const ROLE_COLORS: Record<string, string> = {
  waiter: "bg-blue-500/10 text-blue-400",
  biller: "bg-purple-500/10 text-purple-400",
  chef: "bg-orange-500/10 text-orange-400",
  kitchen: "bg-amber-500/10 text-amber-400",
  busboy: "bg-green-500/10 text-green-400",
  cleaner: "bg-teal-500/10 text-teal-400",
  manager: "bg-neutral-500/10 text-neutral-400",
  owner: "bg-red-500/10 text-red-400",
};

const ROLE_LABELS: Record<string, string> = {
  waiter: "Waiter",
  biller: "Biller",
  chef: "Chef",
  kitchen: "Kitchen",
  busboy: "Busboy",
  cleaner: "Cleaner",
  manager: "Manager",
  owner: "Owner",
};

export default function ClockTokenPage() {
  const { token } = useParams<{ token: string }>();
  const [step, setStep] = useState<"hotel" | "pin" | "list" | "detail">("hotel");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: hotel, isLoading: hotelLoading, error: hotelError } = useQuery<Hotel>({
    queryKey: ["clock-hotel", token],
    queryFn: async () => {
      let res = await fetch(`/api/hotels/lookup?token=${token}`);
      if (res.ok) return res.json();
      res = await fetch(`/api/hotels/lookup?slug=${token}`);
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
        body: JSON.stringify({ token, pin, type: "clock" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid PIN");
      return data;
    },
    onSuccess: () => { setStep("list"); setPinError(""); },
    onError: (err: Error) => { setPinError(err.message); setPin(""); },
  });

  const { data: staff = [], isLoading: staffLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff-list", hotel?.id],
    queryFn: () => fetch(`/api/staff/clock-by-name?hotelId=${hotel?.id}`).then((r) => r.json()),
    enabled: !!hotel?.id && step !== "pin" && step !== "hotel",
  });

  const clockMutation = useMutation({
    mutationFn: async ({ action, id }: { action: "in" | "out"; id: string }) => {
      const res = await fetch("/api/staff/clock-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, identifier: id, hotelId: hotel?.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return { ...data, action };
    },
    onSuccess: (data) => {
      setResult({ success: true, message: `${selectedStaff?.name || "Staff"} clocked ${data.action === "in" ? "in" : "out"}` });
      setSelectedStaff(null);
      setStep("list");
      setTimeout(() => setResult(null), 3500);
    },
    onError: (err: Error) => {
      setResult({ success: false, message: err.message });
      setTimeout(() => setResult(null), 3000);
    },
  });

  useEffect(() => { if (hotel && step === "hotel") setStep("pin"); }, [hotel, step]);

  const filtered = useMemo(() => {
    // Filter out admin/owner roles - they don't clock in
    const clockable = staff.filter((s) => !["owner", "manager", "platform_admin"].includes(s.role));
    if (!search.trim()) return clockable;
    const q = search.toLowerCase();
    return clockable.filter((s) =>
      (s.name && s.name.toLowerCase().includes(q)) ||
      s.role.toLowerCase().includes(q) ||
      s.userId.toLowerCase().includes(q)
    );
  }, [staff, search]);

  // Loading
  if (hotelLoading || step === "hotel") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // Not found
  if (hotelError || !hotel) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Link Invalid</h2>
          <p className="text-xs text-neutral-500 font-bold uppercase tracking-widest">This clock link is invalid or revoked</p>
        </div>
      </div>
    );
  }

  // PIN Entry
  if (step === "pin") {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-xl font-black text-white uppercase tracking-tight">{hotel.name}</h1>
            <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest font-bold">Staff Clock</p>
          </div>
          <div className="space-y-4">
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter" && pin.length >= 4) verifyPinMutation.mutate(); }}
              placeholder="Enter PIN"
              maxLength={6}
              autoFocus
              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl py-3 px-4 text-sm text-white placeholder:text-neutral-600 focus:outline-none focus:border-orange-500 tracking-[0.5em] font-mono text-center text-lg"
            />
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

  // Staff List with Search
  if (step === "list") {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-4 shrink-0">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-sm font-black tracking-tight uppercase text-white">{hotel.name}</h1>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500">Staff Clock</p>
              </div>
              <div className="flex items-center gap-3">
                {!showSearch && (
                  <button onClick={() => setShowSearch(true)} className="w-10 h-10 rounded-xl bg-neutral-800 flex items-center justify-center">
                    <Search className="w-4 h-4 text-neutral-400" />
                  </button>
                )}
                <LiveClock />
              </div>
            </div>
            {showSearch && (
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name or role..."
                  autoFocus
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-xl py-3 pl-10 pr-10 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:border-orange-500"
                />
                <button onClick={() => { setShowSearch(false); setSearch(""); }} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-neutral-500 hover:text-white" />
                </button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-lg mx-auto space-y-2">
            {staffLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16">
                <User className="w-10 h-10 text-neutral-700 mx-auto mb-3" />
                <p className="text-sm font-bold text-neutral-500 uppercase tracking-widest">
                  {search ? "No matches" : "No staff yet"}
                </p>
              </div>
            ) : (
              filtered.map((member, i) => (
                <motion.button
                  key={member.userId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => { setSelectedStaff(member); setStep("detail"); }}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex items-center gap-4 hover:border-orange-500/50 transition-all active:scale-[0.98] text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-white">
                      {(member.name || "?")[0]?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{member.name || "Unknown"}</p>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{ROLE_LABELS[member.role] || member.role}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${ROLE_COLORS[member.role] || "bg-neutral-800 text-neutral-400"}`}>
                    {ROLE_LABELS[member.role] || member.role}
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-600" />
                </motion.button>
              ))
            )}
          </div>
        </main>
      </div>
    );
  }

  // Staff Detail + Clock In/Out
  if (step === "detail" && selectedStaff) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        <header className="bg-neutral-900 border-b border-neutral-800 px-4 py-4 shrink-0">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button onClick={() => { setSelectedStaff(null); setStep("list"); setResult(null); }}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors">
              <ChevronRight className="w-5 h-5 rotate-180 text-neutral-300" />
            </button>
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase text-white">{hotel.name}</h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500">Staff Clock</p>
            </div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-sm text-center">
            <div className="w-20 h-20 rounded-2xl bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl font-black text-white">{(selectedStaff.name || "?")[0]?.toUpperCase()}</span>
            </div>
            <h2 className="text-2xl font-black tracking-tighter uppercase text-white mb-1">{selectedStaff.name || "Staff"}</h2>
            <div className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2 ${ROLE_COLORS[selectedStaff.role] || "bg-neutral-800 text-neutral-400"}`}>
              {ROLE_LABELS[selectedStaff.role] || selectedStaff.role}
            </div>
            <p className="text-[10px] font-bold text-neutral-600 font-mono mb-10">{selectedStaff.userId.slice(0, 8)}...</p>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => clockMutation.mutate({ action: "in", id: selectedStaff.name || selectedStaff.userId })}
                disabled={clockMutation.isPending}
                className="bg-green-500 hover:bg-green-600 text-white rounded-2xl py-8 px-6 transition-all active:scale-[0.97] disabled:opacity-50 shadow-lg shadow-green-500/20"
              >
                <div className="flex flex-col items-center gap-3">
                  {clockMutation.isPending ? <Loader2 className="w-10 h-10 animate-spin" /> : <LogIn className="w-10 h-10" />}
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Clock In</span>
                </div>
              </button>
              <button
                onClick={() => clockMutation.mutate({ action: "out", id: selectedStaff.name || selectedStaff.userId })}
                disabled={clockMutation.isPending}
                className="bg-neutral-900 border-2 border-neutral-700 hover:border-red-500 text-white rounded-2xl py-8 px-6 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <div className="flex flex-col items-center gap-3">
                  {clockMutation.isPending ? <Loader2 className="w-10 h-10 animate-spin text-red-500" /> : <LogOut className="w-10 h-10 text-neutral-400" />}
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400">Clock Out</span>
                </div>
              </button>
            </div>
          </div>
        </main>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-5 rounded-2xl flex items-center gap-3 shadow-xl z-50 ${result.success ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
              {result.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              <span className="text-sm font-black uppercase tracking-widest">{result.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
