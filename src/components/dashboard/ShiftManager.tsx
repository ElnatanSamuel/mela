"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Clock, Play, Square, Loader2, FileText } from "lucide-react";
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

export default function ShiftManager() {
  const queryClient = useQueryClient();
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
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
    },
  });

  const closeShiftMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "close" }),
      });
      return res.json();
    },
    onSuccess: (data: Shift) => {
      queryClient.invalidateQueries({ queryKey: ["active-shift"] });
      setShowCloseConfirm(false);
      setClosing(false);
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
      className="bg-white border border-neutral-200 rounded-[6px] p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-neutral-900" />
          <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
            Shift
          </h3>
        </div>
        {activeShift ? (
          <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Open {duration}h
          </span>
        ) : (
          <span className="bg-neutral-50 text-neutral-400 border border-neutral-200 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
            Closed
          </span>
        )}
      </div>

      {activeShift ? (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-neutral-50 rounded-[4px] p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                Cash
              </p>
              <p className="text-sm font-black text-neutral-900">
                {formatCurrency(activeShift.totalCash)}
              </p>
            </div>
            <div className="bg-neutral-50 rounded-[4px] p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                Digital
              </p>
              <p className="text-sm font-black text-neutral-900">
                {formatCurrency(activeShift.totalDigital)}
              </p>
            </div>
            <div className="bg-neutral-50 rounded-[4px] p-3 text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
                Orders
              </p>
              <p className="text-sm font-black text-neutral-900">
                {activeShift.totalOrders}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCloseConfirm(true)}
            className="w-full py-3 bg-neutral-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Square className="w-3.5 h-3.5" />
            Close Shift
          </button>
        </div>
      ) : (
        <button
          onClick={() => openShiftMutation.mutate()}
          disabled={openShiftMutation.isPending}
          className="w-full py-4 bg-neutral-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
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
        message={`Close the current shift?`}
        confirmLabel={closing ? "Closing..." : "Close Shift"}
        variant="default"
        isLoading={closing}
      />
    </motion.div>
  );
}
