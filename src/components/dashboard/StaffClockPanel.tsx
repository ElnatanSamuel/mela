"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, LogIn, LogOut, Loader2, Users } from "lucide-react";
import { motion } from "framer-motion";

interface AttendanceRecord {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  shiftId: string | null;
  role: string | null;
  durationMinutes: number | null;
}

export default function StaffClockPanel({ hotelId }: { hotelId: string }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: attendance = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["staff-attendance", hotelId, today],
    queryFn: () =>
      fetch(`/api/staff/attendance?hotelId=${hotelId}&date=${today}`).then((r) => r.json()),
    refetchInterval: 15000,
  });

  const clockMutation = useMutation({
    mutationFn: async (action: "in" | "out") => {
      const res = await fetch("/api/staff/clock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance", hotelId, today] });
    },
  });

  const isClockedIn = attendance.some((r) => !r.clockOut);

  function formatDuration(minutes: number | null): string {
    if (minutes === null) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  const currentRecord = attendance.find((r) => !r.clockOut);
  const clockInTime = currentRecord?.clockIn
    ? new Date(currentRecord.clockIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

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
            Staff Clock
          </h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
            isClockedIn
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-neutral-50 text-neutral-400 border border-neutral-200"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isClockedIn ? "bg-green-500 animate-pulse" : "bg-neutral-300"
            }`}
          />
          {isClockedIn ? "On Duty" : "Off Duty"}
        </span>
      </div>

      <div className="mb-6 p-4 bg-neutral-50 rounded-[4px] border border-neutral-100">
        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1">
          {isClockedIn ? "Clocked in at" : "Current Status"}
        </p>
        <p className="text-lg font-black text-neutral-900">
          {isClockedIn ? clockInTime : "Not clocked in"}
        </p>
      </div>

      <button
        onClick={() => clockMutation.mutate(isClockedIn ? "out" : "in")}
        disabled={clockMutation.isPending}
        className={`w-full py-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
          isClockedIn
            ? "bg-red-600 text-white hover:bg-red-700"
            : "bg-neutral-900 text-white hover:bg-black"
        }`}
      >
        {clockMutation.isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isClockedIn ? (
          <>
            <LogOut className="w-4 h-4" />
            Clock Out
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Clock In
          </>
        )}
      </button>

      <div className="mt-6 pt-6 border-t border-neutral-100">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-neutral-400" />
          <h4 className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
            Today's Staff ({attendance.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-neutral-50 animate-pulse rounded-[4px]" />
            ))}
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-6 text-center">
            <Clock className="w-6 h-6 text-neutral-200 mx-auto mb-2" />
            <p className="text-[10px] text-neutral-300 font-bold uppercase tracking-widest">
              No clock-ins today
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {attendance.map((record) => (
              <div
                key={record.id}
                className="flex items-center justify-between py-2 px-3 rounded-[4px] bg-neutral-50"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-[8px] font-black text-neutral-600 uppercase">
                      {record.role?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-neutral-900 uppercase tracking-tight">
                      {record.role || "Staff"}
                    </p>
                    <p className="text-[8px] text-neutral-400 font-medium">
                      {new Date(record.clockIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {record.clockOut
                        ? ` - ${new Date(record.clockOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                        : " ★"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-neutral-600">
                  {formatDuration(record.durationMinutes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
