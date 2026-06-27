"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock, LogIn, LogOut, Loader2, Search, User, CheckCircle2, Building2, ArrowRight, ChevronLeft } from "lucide-react";
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

export default function ClockPage() {
  const [hotelQuery2, setHotelQuery] = useState("");
  const [hotelId, setHotelId] = useState("");
  const [hotelName, setHotelName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; action?: string } | null>(null);
  const [step, setStep] = useState<"hotel" | "clock">("hotel");

  const { data: hotels = [], isFetching: searchingHotel } = useQuery<Hotel[]>({
    queryKey: ["hotel-search", hotelQuery2],
    queryFn: () => fetch(`/api/hotels/lookup?q=${hotelQuery2}`).then((r) => r.json()),
    enabled: hotelQuery2.length > 1,
  });

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["staff-list", hotelId],
    queryFn: () => fetch(`/api/staff/clock-by-name?hotelId=${hotelId}`).then((r) => r.json()),
    enabled: !!hotelId && step === "clock",
  });

  const clockMutation = useMutation({
    mutationFn: async ({ action, identifier }: { action: "in" | "out"; identifier: string }) => {
      const res = await fetch("/api/staff/clock-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, identifier, hotelId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return { ...data, action };
    },
    onSuccess: (data) => {
      setResult({ success: true, message: `Clocked ${data.action === "in" ? "in" : "out"}`, action: data.action });
      setIdentifier("");
      setTimeout(() => setResult(null), 4000);
    },
    onError: (err: Error) => {
      setResult({ success: false, message: err.message });
      setTimeout(() => setResult(null), 3000);
    },
  });

  const selectHotel = (hotel: Hotel) => {
    setHotelId(hotel.id);
    setHotelName(hotel.name);
    setStep("clock");
  };

  const handleClock = (action: "in" | "out") => {
    if (!identifier.trim()) return;
    clockMutation.mutate({ action, identifier: identifier.trim() });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-4">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {step === "clock" && (
            <button onClick={() => { setStep("hotel"); setHotelId(""); setHotelName(""); setIdentifier(""); }} className="p-2 -ml-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-[4px] transition-colors">
              <ChevronLeft className="w-4 h-4 text-neutral-500" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase text-neutral-900 dark:text-neutral-100">Mela</h1>
            {step === "clock" && <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">{hotelName}</p>}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {/* Step 1: Hotel Selection */}
            {step === "hotel" && (
              <motion.div
                key="hotel"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-xl font-black tracking-tighter uppercase text-neutral-900 dark:text-neutral-100">Clock In / Out</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-2">Select your hotel to begin</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={hotelQuery2}
                    onChange={(e) => setHotelQuery(e.target.value)}
                    placeholder="Search hotel name..."
                    className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-[6px] py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-colors"
                    autoFocus
                  />
                  {searchingHotel && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-neutral-400" />}
                </div>

                {hotels.length > 0 && (
                  <div className="space-y-2">
                    {hotels.map((hotel) => (
                      <button
                        key={hotel.id}
                        onClick={() => selectHotel(hotel)}
                        className="w-full flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-[6px] hover:border-orange-500 transition-all group"
                      >
                        <div className="w-10 h-10 bg-orange-500/10 rounded-[4px] flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">{hotel.name}</p>
                          <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{hotel.slug}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Clock In/Out */}
            {step === "clock" && (
              <motion.div
                key="clock"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center mb-4">
                  <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-lg font-black tracking-tighter uppercase text-neutral-900 dark:text-neutral-100">Who are you?</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">Type your name or email</p>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Your name or email..."
                    className="w-full bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 rounded-[6px] py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-orange-500 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 transition-colors"
                    onKeyDown={(e) => { if (e.key === "Enter" && identifier.trim()) handleClock("in"); }}
                    autoFocus
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleClock("in")}
                    disabled={!identifier.trim() || clockMutation.isPending}
                    className="py-4 bg-orange-500 text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-orange-500/20"
                  >
                    {clockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                    Clock In
                  </button>
                  <button
                    onClick={() => handleClock("out")}
                    disabled={!identifier.trim() || clockMutation.isPending}
                    className="py-4 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:border-neutral-400 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {clockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                    Clock Out
                  </button>
                </div>

                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className={`p-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                        result.success
                          ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                      }`}
                    >
                      {result.success ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      {result.message}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Staff list */}
                {staff.length > 0 && (
                  <div className="border-t border-neutral-200 dark:border-neutral-800 pt-4">
                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-widest mb-3">Or tap your name</p>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto">
                      {staff.map((s) => (
                        <button
                          key={s.userId}
                          onClick={() => setIdentifier(s.name || s.userId)}
                          className="w-full flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-[6px] hover:border-orange-500 transition-all text-left"
                        >
                          <div className="w-8 h-8 bg-orange-500/10 rounded-[4px] flex items-center justify-center">
                            <User className="w-4 h-4 text-orange-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight truncate">{s.name || "Staff"}</p>
                            <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">{s.role}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
