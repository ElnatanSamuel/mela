"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import {
  Plus,
  Loader2,
  Power,
  PowerOff,
  Tag,
  Percent,
  Calendar,
  Edit2,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import ActionMenu from "@/components/ui/ActionMenu";
import { motion, AnimatePresence } from "framer-motion";

interface PromoCode {
  id: string;
  code: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderAmount: string;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  validFrom: string;
  validUntil: string | null;
}

export default function PromoCodeManager() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCode, setEditCode] = useState<PromoCode | null>(null);
  const [deleteCode, setDeleteCode] = useState<PromoCode | null>(null);

  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");

  const { data: promoCodeList = [] } = useQuery<PromoCode[]>({
    queryKey: ["promo-codes"],
    queryFn: () => fetch("/api/promo-codes").then((r) => r.json()),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/promo-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountType,
          discountValue,
          minOrderAmount: minOrderAmount || "0",
          maxUses: maxUses ? parseInt(maxUses) : 0,
          validFrom: validFrom || undefined,
          validUntil: validUntil || undefined,
        }),
      });
      if (!res.ok) throw new Error("Failed to create promo code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<PromoCode> & { id: string }) => {
      const res = await fetch(`/api/promo-codes/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update promo code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/promo-codes/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete promo code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
      setDeleteCode(null);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await fetch(`/api/promo-codes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle promo code");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promo-codes"] });
    },
  });

  const openCreateModal = () => {
    setEditCode(null);
    setCode("");
    setDiscountType("percentage");
    setDiscountValue("");
    setMinOrderAmount("");
    setMaxUses("");
    setValidFrom("");
    setValidUntil("");
    setIsModalOpen(true);
  };

  const openEditModal = (promo: PromoCode) => {
    setEditCode(promo);
    setCode(promo.code);
    setDiscountType(promo.discountType);
    setDiscountValue(promo.discountValue);
    setMinOrderAmount(promo.minOrderAmount);
    setMaxUses(promo.maxUses.toString());
    setValidFrom(promo.validFrom ? new Date(promo.validFrom).toISOString().slice(0, 16) : "");
    setValidUntil(promo.validUntil ? new Date(promo.validUntil).toISOString().slice(0, 16) : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditCode(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editCode) {
      updateMutation.mutate({
        id: editCode.id,
        code,
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount || "0",
        maxUses: maxUses ? parseInt(maxUses) : 0,
        validFrom: validFrom || undefined,
        validUntil: validUntil || undefined,
      });
      closeModal();
    } else {
      createMutation.mutate();
    }
  };

  const usagePercent = (used: number, max: number) => {
    if (max === 0) return 0;
    return Math.min(100, Math.round((used / max) * 100));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
            Promo Codes
          </h3>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">
            Discount codes for guest orders
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-primary text-primary-foreground px-5 py-2.5 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          New Code
        </button>
      </div>

      <div className="bg-card border border-border rounded-[6px] overflow-visible shadow-sm dark:shadow-black/10">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted">
              <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Code
              </th>
              <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Discount
              </th>
              <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Min Order
              </th>
              <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Usage
              </th>
              <th className="text-left px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Valid
              </th>
              <th className="text-center px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Active
              </th>
              <th className="text-right px-6 py-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {promoCodeList.map((promo) => (
                <motion.tr
                  key={promo.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="border-b border-border last:border-b-0 hover:bg-muted transition-colors"
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="font-black text-foreground text-sm uppercase tracking-tight">
                        {promo.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1">
                      {promo.discountType === "percentage" ? (
                        <Percent className="w-3.5 h-3.5 text-muted-foreground" />
                      ) : null}
                      <span className="font-bold text-foreground text-sm">
                        {promo.discountType === "percentage"
                          ? `${promo.discountValue}%`
                          : formatCurrency(promo.discountValue)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-muted-foreground">
                      {parseFloat(promo.minOrderAmount) > 0
                        ? formatCurrency(promo.minOrderAmount)
                        : "—"}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-foreground whitespace-nowrap">
                        {promo.usedCount}/{promo.maxUses || "∞"}
                      </span>
                      {promo.maxUses > 0 && (
                        <div className="flex-1 max-w-[80px] h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${usagePercent(promo.usedCount, promo.maxUses)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
                      <Calendar className="w-3 h-3" />
                      {promo.validUntil
                        ? `${new Date(promo.validFrom).toLocaleDateString()} - ${new Date(promo.validUntil).toLocaleDateString()}`
                        : `From ${new Date(promo.validFrom).toLocaleDateString()}`}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <button
                      onClick={() =>
                        toggleActiveMutation.mutate({
                          id: promo.id,
                          isActive: !promo.isActive,
                        })
                      }
                      disabled={toggleActiveMutation.isPending}
                      className={`p-2 rounded-full transition-all ${
                        promo.isActive
                          ? "text-green-600 bg-green-50 hover:bg-green-100"
                          : "text-muted-foreground bg-muted hover:bg-muted"
                      }`}
                    >
                      {promo.isActive ? (
                        <Power className="w-4 h-4" />
                      ) : (
                        <PowerOff className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <ActionMenu
                      actions={[
                        { label: "Edit", icon: <Edit2 className="w-3.5 h-3.5" />, onClick: () => openEditModal(promo) },
                        { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => setDeleteCode(promo), danger: true },
                      ]}
                    />
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>

        {promoCodeList.length === 0 && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <Tag className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
              No promo codes yet
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editCode ? "Edit Promo Code" : "Create Promo Code"}
        description={editCode ? "Update promo code" : "Add a discount code"}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
              Code
            </label>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="SUMMER20"
              className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground uppercase tracking-wider"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Discount Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDiscountType("percentage")}
                className={`flex-1 py-3 rounded-[4px] text-[10px] font-black uppercase tracking-widest border transition-all ${
                  discountType === "percentage"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border"
                }`}
              >
                <Percent className="w-3.5 h-3.5 mx-auto mb-0.5" />
                Percentage
              </button>
              <button
                type="button"
                onClick={() => setDiscountType("fixed")}
                className={`flex-1 py-3 rounded-[4px] text-[10px] font-black uppercase tracking-widest border transition-all ${
                  discountType === "fixed"
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border"
                }`}
              >
                Fixed Amount
              </button>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
              {discountType === "percentage" ? "Discount (%)" : "Discount Amount (ETB)"}
            </label>
            <input
              required
              type="number"
              min="0"
              step="any"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                Min Order Amount
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="0"
                className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                Max Uses
              </label>
              <input
                type="number"
                min="0"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="0 = unlimited"
                className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                Valid From
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={validFrom ? validFrom.split("T")[0] || validFrom.slice(0, 10) : ""}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = validFrom?.split("T")[1] || "00:00";
                    setValidFrom(`${date}T${time}`);
                  }}
                  className="w-full bg-muted border border-border rounded-[4px] px-3 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
                />
                <input
                  type="time"
                  value={validFrom?.split("T")[1] || ""}
                  onChange={(e) => {
                    const date = validFrom?.split("T")[0] || "";
                    setValidFrom(`${date}T${e.target.value}`);
                  }}
                  className="w-full bg-muted border border-border rounded-[4px] px-3 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-1">
                Valid Until
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={validUntil ? validUntil.split("T")[0] || validUntil.slice(0, 10) : ""}
                  onChange={(e) => {
                    const date = e.target.value;
                    const time = validUntil?.split("T")[1] || "23:59";
                    setValidUntil(`${date}T${time}`);
                  }}
                  className="w-full bg-muted border border-border rounded-[4px] px-3 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
                />
                <input
                  type="time"
                  value={validUntil?.split("T")[1] || ""}
                  onChange={(e) => {
                    const date = validUntil?.split("T")[0] || "";
                    setValidUntil(`${date}T${e.target.value}`);
                  }}
                  className="w-full bg-muted border border-border rounded-[4px] px-3 py-3 text-xs font-bold focus:outline-none focus:border-foreground"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="w-full bg-primary text-primary-foreground py-4 rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : editCode ? (
              "Update Promo Code"
            ) : (
              "Create Promo Code"
            )}
          </button>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteCode}
        onClose={() => setDeleteCode(null)}
        onConfirm={() => deleteMutation.mutate(deleteCode!.id)}
        title="Delete Promo Code"
        message={`Are you sure you want to delete "${deleteCode?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
