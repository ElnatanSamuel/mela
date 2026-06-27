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
} from "lucide-react";
import ShiftManager from "@/components/dashboard/ShiftManager";
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
  auth: string;
  user: { id: string; email: string };
  role: { userId: string; role: string; hotelId: string; hotelName: string };
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

export default function StaffContent({
  hotelId,
  role,
}: {
  hotelId: string;
  role: string;
}) {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StaffSchedule | null>(
    null,
  );
  const [selectedDay, setSelectedDay] = useState<number>(
    new Date().getDay(),
  );
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("17:00");
  const [deleteTarget, setDeleteTarget] = useState<StaffSchedule | null>(null);

  const { data: schedules = [], isLoading: loadingSchedules } = useQuery<
    StaffSchedule[]
  >({
    queryKey: ["staff-schedules", hotelId],
    queryFn: () =>
      fetch("/api/staff/schedules").then((r) => r.json()),
  });

  const { data: authInfo, isLoading: loadingStaff } = useQuery<StaffMember>({
    queryKey: ["auth-debug"],
    queryFn: () => fetch("/api/auth/debug").then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/staff/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser || authInfo?.user?.id,
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
    setSelectedUser("");
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
    setSelectedUser(schedule.userId);
    setStartTime(schedule.startTime);
    setEndTime(schedule.endTime);
    setEditingSchedule(schedule);
    setModalOpen(true);
  }

  const currentUserId = authInfo?.user?.id;
  const staffLabel = currentUserId ? authInfo?.role?.role || "Staff" : "Staff";

  function getSchedulesForDay(day: number) {
    return schedules.filter((s) => s.dayOfWeek === day);
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

      <div className="border-t border-border pt-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-foreground" />
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
                Work Schedules
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Set expected hours for each day
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

          <div className="grid grid-cols-7 min-h-[160px]">
            {DAYS.map((day, dayIndex) => {
              const daySchedules = getSchedulesForDay(dayIndex);
              return (
                <div
                  key={day}
                  className="border-r border-border last:border-r-0 p-2 space-y-2"
                >
                  {loadingSchedules || loadingStaff ? (
                    <div className="space-y-1">
                      {[1, 2].map((j) => (
                        <div
                          key={j}
                          className="h-14 bg-muted animate-pulse rounded-[4px]"
                        />
                      ))}
                    </div>
                  ) : daySchedules.length === 0 ? (
                    <button
                      onClick={() => openAddModal(dayIndex)}
                      className="w-full h-full min-h-[60px] border border-dashed border-border rounded-[4px] flex flex-col items-center justify-center gap-1 hover:bg-muted transition-colors group"
                    >
                      <Plus className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/30 group-hover:text-muted-foreground transition-colors">
                        Add
                      </span>
                    </button>
                  ) : (
                    <div className="space-y-1">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="bg-muted border border-border rounded-[4px] p-2 group relative"
                        >
                          <button
                            onClick={() => openEditModal(schedule)}
                            className="w-full text-left"
                          >
                            <p className="text-[9px] font-black text-foreground truncate">
                              {schedule.userId === currentUserId
                                ? `${staffLabel} (you)`
                                : schedule.userId.slice(0, 8)}
                            </p>
                            <p className="text-[8px] font-bold text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {schedule.startTime} - {schedule.endTime}
                            </p>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(schedule)}
                            className="absolute top-1 right-1 p-0.5 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-all"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-destructive" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => openAddModal(dayIndex)}
                        className="w-full py-1 border border-dashed border-border rounded-[4px] flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        <Plus className="w-2.5 h-2.5 text-muted-foreground/40" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingSchedule(null);
          resetForm();
        }}
        title={editingSchedule ? "Edit Schedule" : "Add Schedule"}
        description="Set work hours for this day"
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

          {currentUserId && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Staff Member
              </label>
              <div className="p-3 bg-muted border border-border rounded-[4px]">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground">
                    {authInfo?.user?.email || staffLabel} (you)
                  </span>
                </div>
                <input type="hidden" value={currentUserId} />
              </div>
            </div>
          )}

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
            disabled={saveMutation.isPending || !currentUserId}
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
    </div>
  );
}
