"use client";

import React from "react";
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

export default function StaffClockPanel({ hotelId, role }: { hotelId: string; role: string }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split("T")[0];
  const isManager = role === "owner" || role === "manager";

  const { data: authInfo } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => fetch("/api/auth/debug").then((r) => r.json()),
  });

  const currentUserId = authInfo?.user?.id;

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

  const myRecord = currentUserId
    ? attendance.find((r) => r.userId === currentUserId && !r.clockOut)
    : null;
  const isClockedIn = !!myRecord;

  function formatDuration(minutes: number | null): string {
    if (minutes === null) return "—";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    return `${h}h ${m}m`;
  }

  const clockInTime = myRecord?.clockIn
    ? new Date(myRecord.clockIn).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

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
            Staff Clock
          </h3>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
            isClockedIn
              ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800"
              : "bg-muted text-muted-foreground border border-border"
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isClockedIn ? "bg-green-500 animate-pulse" : "bg-muted-foreground/30"
            }`}
          />
          {isClockedIn ? "On Duty" : "Off Duty"}
        </span>
      </div>

      <div className="mb-6 p-4 bg-muted rounded-[4px] border border-border">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">
          {isClockedIn ? "Clocked in at" : "Current Status"}
        </p>
        <p className="text-lg font-black text-foreground">
          {isClockedIn ? clockInTime : "Not clocked in"}
        </p>
      </div>

      {!isManager && (
        <button
          onClick={() => clockMutation.mutate(isClockedIn ? "out" : "in")}
          disabled={clockMutation.isPending || !currentUserId}
          className={`w-full py-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
            isClockedIn
              ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
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
      )}

      {isManager && (
        <div className="w-full py-3 bg-muted border border-border rounded-[4px] text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Manager — no clock in required</p>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Today&apos;s Staff ({attendance.length})
          </h4>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded-[4px]" />
            ))}
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-6 text-center">
            <Clock className="w-6 h-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              No clock-ins today
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {attendance.map((record) => (
              <div
                key={record.id}
                className={`flex items-center justify-between py-2 px-3 rounded-[4px] ${
                  record.userId === currentUserId ? "bg-primary/10 border border-primary/20" : "bg-muted"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-border flex items-center justify-center">
                    <span className="text-[8px] font-black text-muted-foreground uppercase">
                      {record.role?.charAt(0) || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-tight">
                      {record.role || "Staff"}
                      {record.userId === currentUserId && (
                        <span className="ml-1 text-[8px] text-primary">(you)</span>
                      )}
                    </p>
                    <p className="text-[8px] text-muted-foreground font-medium">
                      {new Date(record.clockIn).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {record.clockOut
                        ? ` - ${new Date(record.clockOut).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
                        : " ★"}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-black text-muted-foreground">
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
