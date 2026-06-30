"use client";

import React, { useState } from "react";
import {
  Loader2,
  Plus,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { createStaff } from "@/lib/actions";
import { useToastStore } from "@/lib/toast-store";

const STAFF_ROLES = [
  { value: "waiter", label: "Waiter" },
  { value: "biller", label: "Biller" },
  { value: "chef", label: "Chef" },
  { value: "kitchen", label: "Kitchen Staff" },
  { value: "busboy", label: "Busboy" },
  { value: "cleaner", label: "Cleaner" },
  { value: "manager", label: "Manager" },
];

export function AddStaffButton({
  hotelsList,
  defaultHotelId,
  compact,
}: {
  hotelsList: { id: string; name: string }[];
  defaultHotelId?: string;
  compact?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useToastStore();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await createStaff(formData);
      setIsOpen(false);
      addToast("Staff member created", "success");
    } catch (err: any) {
      addToast(err.message || "Failed to create staff", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={
          compact
            ? "p-2.5 bg-neutral-900 text-white rounded-[4px] hover:opacity-90 transition-all shadow-sm"
            : "bg-neutral-900 text-white px-6 py-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        }
        title="Add Staff"
      >
        {compact ? (
          <Plus className="w-4 h-4" />
        ) : (
          <>
            <Plus className="w-4 h-4" />
            Add Staff
          </>
        )}
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add Staff"
        description="Create a new staff member"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Full Name
              </label>
              <input
                name="name"
                required
                type="text"
                placeholder="e.g. Abebe Kebede"
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                Email
              </label>
              <input
                name="email"
                required
                type="email"
                placeholder="staff@mela.com"
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Role
                </label>
                <select
                  name="role"
                  required
                  className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900 appearance-none bg-white"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Staff PIN
                </label>
                <input
                  name="pin"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  defaultValue={String(1000 + Math.floor(Math.random() * 9000))}
                  placeholder="4-6 digit PIN"
                  className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold font-mono tracking-widest focus:outline-none focus:border-neutral-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  Hotel
                </label>
                <select
                  name="hotelId"
                  defaultValue={defaultHotelId || ""}
                  className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900 appearance-none bg-white disabled:bg-neutral-50 disabled:text-neutral-400"
                  disabled={!!defaultHotelId}
                >
                  <option value="">All Hotels</option>
                  {hotelsList.map((h) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
                {defaultHotelId && (
                  <input type="hidden" name="hotelId" value={defaultHotelId} />
                )}
              </div>
            </div>

            <div className="p-4 bg-neutral-50 rounded-[6px] border border-neutral-100">
              <p className="text-[9px] font-black uppercase tracking-widest text-neutral-400 leading-relaxed">
                A password will be sent to this email address.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neutral-900 text-white py-4 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Staff"}
          </button>
        </form>
      </Modal>
    </>
  );
}
