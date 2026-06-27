"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock, LogIn, LogOut, Loader2, Search, User, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StaffMember {
  userId: string;
  role: string;
}

export default function ClockInOut() {
  const [identifier, setIdentifier] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string; role?: string; action?: string } | null>(null);

  const { data: staff = [] } = useQuery<StaffMember[]>({
    queryKey: ["staff-list"],
    queryFn: () => fetch("/api/staff/clock-by-name").then((r) => r.json()),
  });

  const clockMutation = useMutation({
    mutationFn: async ({ action, identifier }: { action: "in" | "out"; identifier: string }) => {
      const res = await fetch("/api/staff/clock-by-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, identifier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return { ...data, action };
    },
    onSuccess: (data) => {
      setResult({ success: true, message: `Clocked ${data.action === "in" ? "in" : "out"} successfully`, role: data.role, action: data.action });
      setIdentifier("");
      setTimeout(() => setResult(null), 4000);
    },
    onError: (err: Error) => {
      setResult({ success: false, message: err.message });
      setTimeout(() => setResult(null), 3000);
    },
  });

  const handleClock = (action: "in" | "out") => {
    if (!identifier.trim()) return;
    clockMutation.mutate({ action, identifier: identifier.trim() });
  };

  return (
    <div className="max-w-lg mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-lg font-black text-foreground tracking-tighter uppercase">Clock In / Out</h2>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Enter your name or email</p>
      </div>

      {/* Search Input */}
      <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="Type your name or email..."
            className="w-full bg-muted border border-border rounded-[4px] py-4 pl-12 pr-4 text-sm font-bold focus:outline-none focus:border-orange-500 text-foreground placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === "Enter" && identifier.trim()) handleClock("in");
            }}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleClock("in")}
            disabled={!identifier.trim() || clockMutation.isPending}
            className="py-4 bg-orange-500 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg"
          >
            {clockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            Clock In
          </button>
          <button
            onClick={() => handleClock("out")}
            disabled={!identifier.trim() || clockMutation.isPending}
            className="py-4 bg-muted border border-border text-foreground rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-muted/80 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {clockMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
            Clock Out
          </button>
        </div>

        {/* Result Message */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${
                result.success
                  ? "bg-green-500/10 text-green-600 border border-green-500/20"
                  : "bg-red-500/10 text-red-600 border border-red-500/20"
              }`}
            >
              {result.success ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              {result.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Staff List */}
      {staff.length > 0 && (
        <div className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Staff Members</p>
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {staff.map((s) => (
              <button
                key={s.userId}
                onClick={() => setIdentifier(s.userId)}
                className="w-full flex items-center gap-3 p-3 border border-border rounded-[4px] hover:bg-muted transition-all text-left"
              >
                <div className="w-8 h-8 bg-muted border border-border rounded-[4px] flex items-center justify-center">
                  <User className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-foreground uppercase tracking-tight truncate">{s.userId.slice(0, 8)}...</p>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.role}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
