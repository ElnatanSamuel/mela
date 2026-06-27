"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { useToastStore } from "@/lib/toast-store";
import { Clock, Play, Square, Loader2 } from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { motion } from "framer-motion";

interface Shift {
  id: string;
  openedAt: string;
  closedAt: string | null;
  totalCash: string;
  totalDigital: string;
  totalOrders: number;
  cashAtOpen: string;
}

export default function ShiftManager({ autoOpen = false }: { autoOpen?: boolean }) {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [closing, setClosing] = useState(false);

  const { data: activeShift } = useQuery<Shift | null>({
    queryKey: ["active-shift"],
    queryFn: () => fetch("/api/shifts").then((r) => r.json()),
    refetchInterval: 10000,
  });

  const openShiftMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "open", cashAtOpen: "0" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to open shift" }));
        throw new Error(err.error || "Failed to open shift");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
      addToast("Shift opened", "success");
    },
    onError: (err: Error) => {
      addToast(err.message, "error");
    },
  });

  // Auto-open shift based on schedule
  useEffect(() => {
    if (!autoOpen || activeShift) return;

    const checkAndAutoOpen = async () => {
      try {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const res = await fetch("/api/staff/schedules");
        const schedules = await res.json();

        const todaySchedule = schedules.find((s: any) => {
          if (s.dayOfWeek !== dayOfWeek) return false;
          const [sh, sm] = s.startTime.split(":").map(Number);
          const startMinutes = sh * 60 + sm;
          return currentMinutes >= startMinutes;
        });

        if (todaySchedule) {
          openShiftMutation.mutate();
        }
      } catch {}
    };

    checkAndAutoOpen();
  }, [autoOpen, activeShift]);

  const closeShiftMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed to close shift" }));
        throw new Error(err.error || "Failed to close shift");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
      setShowCloseConfirm(false);
      setClosing(false);
      addToast("Shift closed", "success");
    },
    onError: (err: Error) => {
      setClosing(false);
      addToast(err.message, "error");
    },
  });

  const duration = activeShift?.openedAt
    ? Math.floor(
        (Date.now() - new Date(activeShift.openedAt).getTime()) / (1000 * 60 * 60),
      )
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-[6px] p-6 shadow-sm dark:shadow-black/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-foreground" />
          <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
            Shift
          </h3>
        </div>
        {activeShift ? (
          <span className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Open {duration}h
          </span>
        ) : (
          <span className="bg-muted text-muted-foreground border border-border px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
            Closed
          </span>
        )}
      </div>

      {activeShift ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted rounded-[4px] p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Cash</p>
              <p className="text-sm font-black text-foreground">{formatCurrency(activeShift.totalCash)}</p>
            </div>
            <div className="bg-muted rounded-[4px] p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Digital</p>
              <p className="text-sm font-black text-foreground">{formatCurrency(activeShift.totalDigital)}</p>
            </div>
            <div className="bg-muted rounded-[4px] p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Orders</p>
              <p className="text-sm font-black text-foreground">{activeShift.totalOrders}</p>
            </div>
          </div>
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="w-full py-3 bg-primary text-primary-foreground rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Square className="w-3.5 h-3.5" />
            Close Shift
          </button>
        </div>
      ) : (
        <button
          onClick={() => openShiftMutation.mutate()}
          disabled={openShiftMutation.isPending}
          className="w-full py-4 bg-primary text-primary-foreground rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {openShiftMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              Open Shift
            </>
          )}
        </button>
      )}

      <ConfirmModal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        onConfirm={() => {
          setClosing(true);
          closeShiftMutation.mutate();
        }}
        title="Close Shift"
        message="Close the current shift?"
        confirmLabel={closing ? "Closing..." : "Close Shift"}
        variant="default"
        isLoading={closing}
      />
    </motion.div>
  );
}
