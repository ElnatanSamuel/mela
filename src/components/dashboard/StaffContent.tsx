"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  Plus,
  Trash2,
  Loader2,
  Users,
  Clock,
  ChevronRight,
  Pencil,
} from "lucide-react";
import ShiftManager from "@/components/dashboard/ShiftManager";
import StaffDetailModal from "@/components/dashboard/StaffDetailModal";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

interface StaffSchedule {
  id: string;
  hotelId: string;
  userId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface StaffMember {
  userId: string;
  name: string | null;
  role: string;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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

function isToday(dayIndex: number): boolean {
  return new Date().getDay() === dayIndex;
}

function isPast(dayIndex: number): boolean {
  const now = new Date();
  const currentDay = now.getDay();
  return dayIndex < currentDay;
}

export default function StaffContent({
  hotelId,
  role,
}: {
  hotelId: string;
  role: string;
}) {
  const queryClient = useQueryClient();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(
    new Date().getDay()
  );
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [deleteTarget, setDeleteTarget] = useState<StaffSchedule | null>(null);

  const { data: staffList = [], isLoading: loadingStaff } = useQuery<
    StaffMember[]
  >({
    queryKey: ["staff-list", hotelId],
    queryFn: async () => {
      const res = await fetch(`/api/staff/clock-by-name?hotelId=${hotelId}`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery<
    StaffSchedule[]
  >({
    queryKey: ["staff-schedules", hotelId],
    queryFn: () => fetch("/api/staff/schedules").then((r) => r.json()),
  });

  const globalSchedules = schedules.reduce<Record<number, StaffSchedule>>(
    (acc, s) => {
      if (!acc[s.dayOfWeek]) acc[s.dayOfWeek] = s;
      return acc;
    },
    {}
  );

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/staff/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "global",
          dayOfWeek: selectedDay,
          startTime,
          endTime,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-schedules", hotelId] });
      setModalOpen(false);
      setEditingSchedule(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/staff/schedules?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-schedules", hotelId] });
      setDeleteTarget(null);
    },
  });

  function resetForm() {
    setSelectedDay(new Date().getDay());
    setStartTime("08:00");
    setEndTime("17:00");
  }

  function openAddModal(day: number) {
    resetForm();
    setSelectedDay(day);
    setEditingSchedule(null);
    setModalOpen(true);
  }

  function openEditModal(schedule: StaffSchedule) {
    setSelectedDay(schedule.dayOfWeek);
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
    setEditingSchedule(schedule);
    setModalOpen(true);
  }

  const staffCount = staffList.length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
          Staff
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
          Manage attendance and work schedules
        </p>
      </div>

      {/* 2-Column Layout: Schedule (left) + Staff/Shift (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
        {/* LEFT: Schedule Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-tight">
                Weekly Schedule
              </h3>
            </div>
          </div>
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
            Hours for all staff — shown on clock-in page
          </p>

          <div className="space-y-1">
            {DAYS.map((day, dayIndex) => {
              const schedule = globalSchedules[dayIndex];
              const today = isToday(dayIndex);
              const past = isPast(dayIndex);

              return (
                <div
                  key={day}
                  className={`flex items-center gap-3 p-3 rounded-[6px] transition-all group ${
                    today
                      ? "bg-orange-500/10 border border-orange-500/20"
                      : past
                      ? "bg-muted/50 border border-transparent opacity-60"
                      : "bg-card border border-border hover:border-muted-foreground/20"
                  }`}
                >
                  {/* Day label */}
                  <div className="w-10 shrink-0">
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        today
                          ? "text-orange-500"
                          : past
                          ? "text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {DAY_ABBREVS[dayIndex]}
                    </span>
                  </div>

                  {/* Schedule content */}
                  <div className="flex-1 min-w-0">
                    {loadingSchedules ? (
                      <div className="h-4 bg-muted animate-pulse rounded w-20" />
                    ) : schedule ? (
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span className="text-xs font-black text-foreground">
                          {schedule.startTime} — {schedule.endTime}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-muted-foreground uppercase">
                        Off
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {schedule ? (
                      <>
                        <button
                          onClick={() => openEditModal(schedule)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                        >
                          <Pencil className="w-3 h-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(schedule);
                          }}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openAddModal(dayIndex)}
                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-muted rounded transition-all"
                      >
                        <Plus className="w-3 h-3 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Schedule summary */}
          <div className="bg-muted border border-border rounded-[6px] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                {Object.keys(globalSchedules).length} of 7 days set
              </span>
              <span className="text-[9px] font-black text-foreground">
                {Object.values(globalSchedules).reduce((acc, s) => {
                  const [sh, sm] = s.startTime.split(":").map(Number);
                  const [eh, em] = s.endTime.split(":").map(Number);
                  return acc + (eh * 60 + em - sh * 60 - sm);
                }, 0) / 60 | 0}h total/week
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: Staff + Shift */}
        <div className="space-y-6">
          {/* Shift Manager */}
          <ShiftManager autoOpen />

          {/* Staff List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-orange-500" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-tight">
                  Staff Members
                </h3>
                <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded-full text-[9px] font-black">
                  {staffCount}
                </span>
              </div>
            </div>

            {loadingStaff ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-16 bg-muted animate-pulse rounded-[6px]"
                  />
                ))}
              </div>
            ) : staffList.length === 0 ? (
              <div className="text-center py-12 bg-card border border-dashed border-border rounded-[6px]">
                <Users className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs font-bold text-muted-foreground">
                  No staff members found
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {staffList.map((member) => (
                  <button
                    key={member.userId}
                    onClick={() => setSelectedStaff(member)}
                    className="w-full flex items-center justify-between p-4 bg-card border border-border rounded-[6px] hover:border-muted-foreground/20 hover:shadow-sm transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                        <span className="text-sm font-black text-foreground">
                          {(member.name || "?")[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-black text-foreground">
                          {member.name || "Unknown"}
                        </p>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            ROLE_COLORS[member.role] ||
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ROLE_LABELS[member.role] || member.role}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSchedule(null);
          resetForm();
        }}
        title={editingSchedule ? "Edit Schedule" : "Add Schedule"}
        description="Set work hours for all staff on this day"
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Day
            </label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(i)}
                  className={`py-2 rounded-[4px] text-[9px] font-black uppercase tracking-widest transition-all ${
                    selectedDay === i
                      ? "bg-orange-500 text-white"
                      : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                  }`}
                >
                  {DAY_ABBREVS[i]}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-muted border border-border rounded-[4px]">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Applies to all staff members
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-3 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-orange-500 bg-card text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-3 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-orange-500 bg-card text-foreground"
              />
            </div>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full py-4 bg-orange-500 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {editingSchedule ? "Update Schedule" : "Add Schedule"}
              </>
            )}
          </button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Remove Schedule"
        message={`Remove schedule for ${DAYS[deleteTarget?.dayOfWeek ?? 0]} (${deleteTarget?.startTime} - ${deleteTarget?.endTime})?`}
        confirmLabel={deleteMutation.isPending ? "Removing..." : "Remove"}
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      {selectedStaff && (
        <StaffDetailModal
          isOpen={!!selectedStaff}
          onClose={() => setSelectedStaff(null)}
          staff={selectedStaff}
        />
      )}
    </div>
  );
}
