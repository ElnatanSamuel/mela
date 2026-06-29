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

export default function StaffContent({
  hotelId,
  role,
}: {
  hotelId: string;
  role: string;
}) {
  const queryClient = useQueryClient();
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(
    null
  );
  const [selectedDay, setSelectedDay] = useState<number>(
    new Date().getDay()
  );
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [deleteTarget, setDeleteTarget] = useState<StaffSchedule | null>(null);

  // Fetch staff list
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

  // Fetch global schedules (no userId filter — same schedule for everyone)
  const { data: schedules = [], isLoading: loadingSchedules } = useQuery<
    StaffSchedule[]
  >({
    queryKey: ["staff-schedules", hotelId],
    queryFn: () => fetch("/api/staff/schedules").then((r) => r.json()),
  });

  // Global schedule — one entry per day
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

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
          Staff
        </h2>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">
          Manage attendance and work schedules
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ShiftManager autoOpen />
      </div>

      {/* Staff List */}
      <div className="border-t border-border pt-12">
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-5 h-5 text-foreground" />
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
              Staff Members
            </h3>
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
              Tap to view attendance details
            </p>
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

      {/* Global Work Schedule */}
      <div className="border-t border-border pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-foreground" />
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                Work Schedule
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Hours for all staff — shown on clock-in page
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[6px] shadow-sm dark:shadow-black/10 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {DAYS.map((day, i) => (
              <div
                key={day}
                className="p-3 text-center border-r border-border last:border-r-0 bg-muted"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hidden sm:inline">
                  {day}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground sm:hidden">
                  {DAY_ABBREVS[i]}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 min-h-[100px]">
            {DAYS.map((day, dayIndex) => {
              const schedule = globalSchedules[dayIndex];
              return (
                <div
                  key={day}
                  className="border-r border-border last:border-r-0 p-2"
                >
                  {loadingSchedules ? (
                    <div className="h-16 bg-muted animate-pulse rounded-[4px]" />
                  ) : schedule ? (
                    <button
                      onClick={() => openEditModal(schedule)}
                      className="w-full bg-muted border border-border rounded-[4px] p-2 text-left hover:bg-muted/80 transition-colors group relative"
                    >
                      <p className="text-[9px] font-black text-foreground flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {schedule.startTime}
                      </p>
                      <p className="text-[9px] font-black text-foreground">
                        {schedule.endTime}
                      </p>
                      <p className="text-[7px] font-bold text-muted-foreground mt-1 uppercase">
                        All Staff
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(schedule);
                        }}
                        className="absolute top-1 right-1 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                      >
                        <Trash2 className="w-2.5 h-2.5 text-destructive" />
                      </button>
                    </button>
                  ) : (
                    <button
                      onClick={() => openAddModal(dayIndex)}
                      className="w-full h-full min-h-[60px] border border-dashed border-border rounded-[4px] flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors group"
                    >
                      <Plus className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/30 group-hover:text-muted-foreground transition-colors">
                        Add
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
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
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground border border-border hover:bg-muted/80"
                  }`}
                >
                  <span className="hidden sm:inline">{DAY_ABBREVS[i]}</span>
                  <span className="sm:hidden">{DAY_ABBREVS[i][0]}</span>
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
                className="w-full p-3 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
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
                className="w-full p-3 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
          </div>

          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="w-full py-4 bg-primary text-primary-foreground rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
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

      {/* Staff Detail Modal */}
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
