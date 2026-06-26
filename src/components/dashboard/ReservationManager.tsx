"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Plus,
  Phone,
  Users,
  Clock,
  Check,
  X,
  LogIn,
  UserX,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Reservation {
  id: string;
  hotelId: string;
  tableId: string | null;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed" | "seated" | "cancelled" | "no_show";
  notes: string | null;
  createdAt: string;
  tableNumber: string | null;
}

interface Table {
  id: string;
  tableNumber: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  seated: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-red-50 text-red-700 border-red-200",
  no_show: "bg-neutral-50 text-neutral-500 border-neutral-200",
};

export default function ReservationManager({ hotelId }: { hotelId: string }) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: reservations = [], isLoading } = useQuery<Reservation[]>({
    queryKey: ["reservations", hotelId, selectedDate],
    queryFn: () =>
      fetch(`/api/reservations?hotelId=${hotelId}&date=${selectedDate}`).then((r) =>
        r.json(),
      ),
    refetchInterval: 15000,
  });

  const { data: tables = [] } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () => fetch("/api/tables").then((r) => r.json()),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", hotelId, selectedDate] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/reservations/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", hotelId, selectedDate] });
    },
  });

  function changeDate(delta: number) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split("T")[0]);
  }

  const totalGuests = reservations.reduce((sum, r) => {
    if (r.status === "cancelled" || r.status === "no_show") return sum;
    return sum + r.guestCount;
  }, 0);

  const activeCount = reservations.filter(
    (r) => r.status !== "cancelled" && r.status !== "no_show",
  ).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 pt-12 border-t border-neutral-200"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-neutral-900" />
          <h3 className="text-xl font-black text-neutral-900 uppercase tracking-tight">
            Reservations
          </h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Reservation
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-neutral-100 rounded transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <div className="text-center">
            <p className="text-lg font-black text-neutral-900 tracking-tight">
              {new Date(selectedDate).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="p-2 hover:bg-neutral-100 rounded transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
              Reservations
            </p>
            <p className="text-xl font-black text-neutral-900">{activeCount}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400">
              Guests
            </p>
            <p className="text-xl font-black text-neutral-900">{totalGuests}</p>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-neutral-50 animate-pulse rounded-[4px]" />
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-neutral-100 rounded-[6px]">
          <CalendarDays className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest">
            No reservations for this date
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {reservations.map((res) => (
            <motion.div
              key={res.id}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between p-4 bg-white border border-neutral-200 rounded-[4px] hover:border-neutral-300 transition-all"
            >
              <div className="flex items-center gap-6">
                <div className="text-center min-w-[60px]">
                  <p className="text-sm font-black text-neutral-900">
                    {new Date(res.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-[8px] font-bold text-neutral-400 uppercase tracking-widest">
                    {new Date(res.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="min-w-[140px]">
                  <p className="text-xs font-black text-neutral-900 uppercase tracking-tight">
                    {res.customerName}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-[9px] text-neutral-400 font-medium">
                      <Phone className="w-3 h-3" />
                      {res.customerPhone}
                    </span>
                    <span className="flex items-center gap-1 text-[9px] text-neutral-400 font-medium">
                      <Users className="w-3 h-3" />
                      {res.guestCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    Table {res.tableNumber || "—"}
                  </span>
                  {res.notes && (
                    <span className="text-[8px] text-neutral-300 italic max-w-[120px] truncate">
                      {res.notes}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border",
                    STATUS_STYLES[res.status],
                  )}
                >
                  {res.status.replace("_", " ")}
                </span>

                <div className="flex items-center gap-1 ml-2">
                  {res.status === "pending" && (
                    <button
                      onClick={() =>
                        statusMutation.mutate({ id: res.id, status: "confirmed" })
                      }
                      className="p-1.5 hover:bg-blue-50 rounded transition-colors"
                      title="Confirm"
                    >
                      <Check className="w-3.5 h-3.5 text-blue-500" />
                    </button>
                  )}
                  {res.status === "confirmed" && (
                    <button
                      onClick={() =>
                        statusMutation.mutate({ id: res.id, status: "seated" })
                      }
                      className="p-1.5 hover:bg-green-50 rounded transition-colors"
                      title="Seat"
                    >
                      <LogIn className="w-3.5 h-3.5 text-green-500" />
                    </button>
                  )}
                  {(res.status === "pending" || res.status === "confirmed") && (
                    <>
                      <button
                        onClick={() =>
                          statusMutation.mutate({ id: res.id, status: "cancelled" })
                        }
                        className="p-1.5 hover:bg-red-50 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                      <button
                        onClick={() =>
                          statusMutation.mutate({ id: res.id, status: "no_show" })
                        }
                        className="p-1.5 hover:bg-neutral-100 rounded transition-colors"
                        title="No Show"
                      >
                        <UserX className="w-3.5 h-3.5 text-neutral-400" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => deleteMutation.mutate(res.id)}
                    className="p-1.5 hover:bg-red-50 rounded transition-colors ml-1"
                    title="Delete"
                  >
                    <X className="w-3 h-3 text-neutral-300 hover:text-red-400 transition-colors" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddReservationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        hotelId={hotelId}
        tables={tables}
        selectedDate={selectedDate}
      />
    </motion.div>
  );
}

function AddReservationModal({
  isOpen,
  onClose,
  hotelId,
  tables,
  selectedDate,
}: {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
  tables: Table[];
  selectedDate: string;
}) {
  const queryClient = useQueryClient();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [guestCount, setGuestCount] = useState("2");
  const [tableId, setTableId] = useState("");
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [notes, setNotes] = useState("");

  const addMutation = useMutation({
    mutationFn: async () => {
      const [h1, m1] = startTime.split(":");
      const [h2, m2] = endTime.split(":");
      const startISO = new Date(`${selectedDate}T${h1}:${m1}:00.000`);
      const endISO = new Date(`${selectedDate}T${h2}:${m2}:00.000`);

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: tableId || null,
          customerName,
          customerPhone,
          guestCount: parseInt(guestCount),
          reservationDate: selectedDate,
          startTime: startISO.toISOString(),
          endTime: endISO.toISOString(),
          notes: notes || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reservations", hotelId] });
      setCustomerName("");
      setCustomerPhone("");
      setGuestCount("2");
      setTableId("");
      setStartTime("18:00");
      setEndTime("20:00");
      setNotes("");
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Reservation" description="Book a table for guests">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Name</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-tight"
              placeholder="Guest name"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Phone</label>
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              placeholder="+251..."
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Guests</label>
            <input
              type="number"
              value={guestCount}
              onChange={(e) => setGuestCount(e.target.value)}
              min="1"
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Table</label>
            <select
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-tight"
            >
              <option value="">No table</option>
              {tables.map((t) => (
                <option key={t.id} value={t.id}>
                  Table {t.tableNumber}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Start Time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">End Time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Notes</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-tight"
            placeholder="Optional notes"
          />
        </div>

        <button
          onClick={() => addMutation.mutate()}
          disabled={!customerName || !customerPhone || addMutation.isPending}
          className="w-full py-4 bg-neutral-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {addMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Create Reservation"
          )}
        </button>
      </div>
    </Modal>
  );
}
