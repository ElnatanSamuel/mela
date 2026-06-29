"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Clock, User, Calendar, Briefcase } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface AttendanceRecord {
  id: string;
  userId: string;
  clockIn: string;
  clockOut: string | null;
  role: string;
  durationMinutes: number | null;
}

interface StaffDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  staff: {
    userId: string;
    name: string | null;
    role: string;
  };
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  waiter: "Waiter",
  chef: "Chef",
  kitchen: "Kitchen",
  biller: "Biller",
  busboy: "Busboy",
  cleaner: "Cleaner",
  platform_admin: "Admin",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  waiter: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  chef: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  kitchen: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  biller: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  busboy: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400",
  cleaner: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export default function StaffDetailModal({
  isOpen,
  onClose,
  staff,
}: StaffDetailModalProps) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const { data: attendance = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: ["staff-attendance-month", staff.userId, yearMonth],
    queryFn: async () => {
      const records: AttendanceRecord[] = [];
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${yearMonth}-${String(day).padStart(2, "0")}`;
        try {
          const res = await fetch(
            `/api/staff/attendance?date=${dateStr}`
          );
          if (res.ok) {
            const dayRecords = await res.json();
            const userRecords = dayRecords.filter(
              (r: AttendanceRecord) => r.userId === staff.userId
            );
            records.push(...userRecords);
          }
        } catch {}
      }
      return records;
    },
    enabled: isOpen,
  });

  const totalMinutes = attendance.reduce(
    (sum, r) => sum + (r.durationMinutes || 0),
    0
  );
  const totalDays = new Set(
    attendance.map((r) => new Date(r.clockIn).toDateString())
  ).size;
  const openClockIns = attendance.filter((r) => !r.clockOut).length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={staff.name || "Staff Member"}
      description="Attendance details and monthly summary"
    >
      <div className="space-y-6">
        {/* Header Info */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-muted border border-border flex items-center justify-center">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">
              {staff.name || "Unknown"}
            </h3>
            <span
              className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                ROLE_COLORS[staff.role] || "bg-muted text-muted-foreground"
              }`}
            >
              {ROLE_LABELS[staff.role] || staff.role}
            </span>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-muted border border-border rounded-[6px] p-3 text-center">
            <p className="text-lg font-black text-foreground">
              {totalDays}
            </p>
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
              Days Worked
            </p>
          </div>
          <div className="bg-muted border border-border rounded-[6px] p-3 text-center">
            <p className="text-lg font-black text-foreground">
              {formatDuration(totalMinutes)}
            </p>
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
              Total Hours
            </p>
          </div>
          <div className="bg-muted border border-border rounded-[6px] p-3 text-center">
            <p className="text-lg font-black text-foreground">
              {openClockIns > 0 ? (
                <span className="text-green-600">{openClockIns}</span>
              ) : (
                "0"
              )}
            </p>
            <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
              On Duty
            </p>
          </div>
        </div>

        {/* Attendance Records */}
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
            Attendance Records
          </h4>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-14 bg-muted animate-pulse rounded-[4px]"
                />
              ))}
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-8 bg-muted rounded-[6px] border border-border">
              <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs font-bold text-muted-foreground">
                No attendance records this month
              </p>
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 bg-muted border border-border rounded-[4px]"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[40px]">
                      <p className="text-sm font-black text-foreground">
                        {new Date(record.clockIn).getDate()}
                      </p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">
                        {new Date(record.clockIn).toLocaleDateString("en-GB", {
                          month: "short",
                        })}
                      </p>
                    </div>
                    <div className="border-l border-border pl-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                        <span>{formatTime(record.clockIn)}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className={record.clockOut ? "" : "text-green-600"}>
                          {record.clockOut
                            ? formatTime(record.clockOut)
                            : "On Duty"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {record.durationMinutes != null ? (
                      <span className="text-xs font-black text-foreground">
                        {formatDuration(record.durationMinutes)}
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-green-600 uppercase">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
