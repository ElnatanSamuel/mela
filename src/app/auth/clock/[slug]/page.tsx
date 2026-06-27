"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Clock,
  LogIn,
  LogOut,
  Loader2,
  User,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
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
      setTime(
        now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      );
      setDate(
        now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="text-center">
      <p className="text-5xl font-black tabular-nums tracking-tighter text-neutral-900 dark:text-white">
        {time}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-neutral-400 mt-1">
        {date}
      </p>
    </div>
  );
}

export default function HotelClockPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [mode, setMode] = useState<"idle" | "confirm">("idle");
  const [clockAction, setClockAction] = useState<"in" | "out">("in");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: hotel, isLoading: hotelLoading, error: hotelError } = useQuery<Hotel>({
    queryKey: ["hotel-by-slug", slug],
    queryFn: () =>
      fetch(`/api/hotels/lookup?slug=${slug}`).then((r) => {
        if (!r.ok) throw new Error("Hotel not found");
        return r.json();
      }),
    enabled: !!slug,
  });

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["staff-list", hotel?.id],
    queryFn: () => fetch(`/api/staff/clock-by-name?hotelId=${hotel?.id}`).then((r) => r.json()),
    enabled: !!hotel?.id,
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
      setResult({
        success: true,
        message: `${selectedStaff?.name || "Staff"} clocked ${data.action === "in" ? "in" : "out"}`,
      });
      setSelectedStaff(null);
      setMode("idle");
      setTimeout(() => setResult(null), 3500);
    },
    onError: (err: Error) => {
      setResult({ success: false, message: err.message });
      setTimeout(() => setResult(null), 3000);
    },
  });

  const selectStaff = (member: StaffMember) => {
    setSelectedStaff(member);
    setMode("confirm");
    setResult(null);
  };

  const handleClock = (action: "in" | "out") => {
    if (!selectedStaff) return;
    setClockAction(action);
    clockMutation.mutate({ action, id: selectedStaff.name || selectedStaff.userId });
  };

  const goBack = () => {
    setSelectedStaff(null);
    setMode("idle");
    setResult(null);
  };

  // --- Loading ---
  if (hotelLoading) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-orange-500" />
      </div>
    );
  }

  // --- Not found ---
  if (hotelError || !hotel) {
    return (
      <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-neutral-900 dark:text-white">
            Hotel Not Found
          </h2>
          <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">
            This clock link is invalid
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-950 flex flex-col">
      {/* Top bar */}
      <header className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode === "confirm" && (
              <button
                onClick={goBack}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180 text-neutral-600 dark:text-neutral-300" />
              </button>
            )}
            <div>
              <h1 className="text-sm font-black tracking-tight uppercase text-neutral-900 dark:text-white">
                {hotel.name}
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-orange-500">
                Staff Clock
              </p>
            </div>
          </div>
          <LiveClock />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {/* STAFF GRID */}
            {mode === "idle" && (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-black tracking-tighter uppercase text-neutral-900 dark:text-white">
                    Tap Your Name
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mt-2">
                    {staff.length} staff members
                  </p>
                </div>

                {staff.length === 0 ? (
                  <div className="text-center py-16">
                    <User className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <p className="text-sm font-bold text-neutral-400 uppercase tracking-widest">
                      No staff registered yet
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {staff.map((member, i) => (
                      <motion.button
                        key={member.userId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => selectStaff(member)}
                        className="group relative bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 text-left hover:border-orange-500 dark:hover:border-orange-500 transition-all duration-150 active:scale-[0.97]"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-6 h-6 text-orange-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-neutral-900 dark:text-white uppercase tracking-tight truncate">
                              {member.name || "Staff"}
                            </p>
                            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-neutral-400 mt-0.5">
                              {member.role}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end">
                          <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* CONFIRM SCREEN */}
            {mode === "confirm" && selectedStaff && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="max-w-sm mx-auto"
              >
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-500/20">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-black tracking-tighter uppercase text-neutral-900 dark:text-white">
                    {selectedStaff.name || "Staff"}
                  </h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-400 mt-1">
                    {selectedStaff.role}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleClock("in")}
                    disabled={clockMutation.isPending}
                    className="group relative bg-green-500 hover:bg-green-600 text-white rounded-2xl py-8 px-6 transition-all duration-150 active:scale-[0.97] disabled:opacity-50 shadow-lg shadow-green-500/20"
                  >
                    <div className="flex flex-col items-center gap-3">
                      {clockMutation.isPending && clockAction === "in" ? (
                        <Loader2 className="w-10 h-10 animate-spin" />
                      ) : (
                        <LogIn className="w-10 h-10" />
                      )}
                      <span className="text-xs font-black uppercase tracking-[0.2em]">
                        Clock In
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={() => handleClock("out")}
                    disabled={clockMutation.isPending}
                    className="group relative bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 hover:border-red-400 dark:hover:border-red-500 text-neutral-900 dark:text-white rounded-2xl py-8 px-6 transition-all duration-150 active:scale-[0.97] disabled:opacity-50"
                  >
                    <div className="flex flex-col items-center gap-3">
                      {clockMutation.isPending && clockAction === "out" ? (
                        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                      ) : (
                        <LogOut className="w-10 h-10 text-neutral-400 group-hover:text-red-500 transition-colors" />
                      )}
                      <span className="text-xs font-black uppercase tracking-[0.2em] text-neutral-400 group-hover:text-red-500 transition-colors">
                        Clock Out
                      </span>
                    </div>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Result toast */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-5 rounded-2xl flex items-center gap-3 shadow-xl ${
                  result.success
                    ? "bg-green-500 text-white"
                    : "bg-red-500 text-white"
                }`}
              >
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
                <span className="text-sm font-black uppercase tracking-widest">
                  {result.message}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
