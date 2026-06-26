"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Minus,
  Loader2,
  X,
  Edit3,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import ActionMenu from "@/components/ui/ActionMenu";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface InventoryItem {
  id: string;
  hotelId: string;
  name: string;
  unit: string;
  stockQuantity: string;
  lowStockThreshold: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface LowStockItem {
  id: string;
  name: string;
  unit: string;
  stockQuantity: string;
  lowStockThreshold: string;
}

export default function InventoryManager({ hotelId }: { hotelId: string }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventory", hotelId, search],
    queryFn: () => {
      const params = new URLSearchParams({ hotelId });
      if (search) params.set("search", search);
      return fetch(`/api/inventory?${params}`).then((r) => r.json());
    },
  });

  const { data: lowStock = [] } = useQuery<LowStockItem[]>({
    queryKey: ["inventory-low-stock", hotelId],
    queryFn: () => fetch(`/api/inventory/low-stock?hotelId=${hotelId}`).then((r) => r.json()),
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", hotelId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock", hotelId] });
      setDeleteTarget(null);
    },
  });

  const stockMutation = useMutation({
    mutationFn: async ({ id, delta }: { id: string; delta: number }) => {
      const item = items.find((i) => i.id === id);
      if (!item) throw new Error("Not found");
      const newQty = Math.max(0, parseFloat(item.stockQuantity) + delta);
      const res = await fetch(`/api/inventory/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: String(newQty) }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onMutate: async ({ id, delta }) => {
      await queryClient.cancelQueries({ queryKey: ["inventory", hotelId] });
      const prev = queryClient.getQueryData<InventoryItem[]>(["inventory", hotelId]);
      queryClient.setQueryData<InventoryItem[]>(["inventory", hotelId], (old) =>
        old?.map((i) =>
          i.id === id
            ? { ...i, stockQuantity: String(Math.max(0, parseFloat(i.stockQuantity) + delta)) }
            : i,
        ),
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(["inventory", hotelId], context.prev);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", hotelId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock", hotelId] });
    },
  });

  function getStockStatus(item: InventoryItem): "good" | "low" | "empty" {
    const qty = parseFloat(item.stockQuantity);
    const threshold = parseFloat(item.lowStockThreshold);
    if (qty <= 0) return "empty";
    if (qty <= threshold) return "low";
    return "good";
  }

  function statusStyles(status: "good" | "low" | "empty") {
    switch (status) {
      case "good":
        return "bg-green-50 text-green-700 border-green-200";
      case "low":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "empty":
        return "bg-red-50 text-red-700 border-red-200";
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-neutral-200 rounded-[6px] p-6 shadow-sm"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-neutral-900" />
          <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">
            Inventory
          </h3>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2.5 rounded-[4px] text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Item
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-[4px] flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-[9px] font-black text-amber-800 uppercase tracking-widest">
            {lowStock.length} item{lowStock.length > 1 ? "s" : ""} low on stock — reorder soon
          </p>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-300" />
        <input
          type="text"
          placeholder="Search inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 placeholder:text-neutral-300 focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-tight"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-neutral-50 animate-pulse rounded-[4px]" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-neutral-100 rounded-[6px]">
          <Package className="w-10 h-10 text-neutral-200 mx-auto mb-3" />
          <p className="text-[10px] font-black text-neutral-300 uppercase tracking-widest mb-4">
            {search ? "No items match your search" : "No inventory items yet"}
          </p>
          {!search && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-neutral-900 text-white px-6 py-3 rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg"
            >
              <Plus className="w-3.5 h-3.5 inline mr-2" />
              Add Your First Item
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="text-left py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Item</th>
                <th className="text-left py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Unit</th>
                <th className="text-right py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Stock</th>
                <th className="text-right py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Threshold</th>
                <th className="text-center py-3 pr-4 text-[10px] font-black uppercase tracking-widest text-neutral-500">Status</th>
                <th className="text-right py-3 text-[10px] font-black uppercase tracking-widest text-neutral-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const status = getStockStatus(item);
                return (
                  <tr key={item.id} className="border-b border-neutral-50 hover:bg-neutral-50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="text-xs font-black text-neutral-900 uppercase tracking-tight">{item.name}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="text-[10px] font-bold text-neutral-400 uppercase">{item.unit}</span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-sm font-black text-neutral-900">{parseFloat(item.stockQuantity).toFixed(1)}</span>
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <span className="text-[10px] font-bold text-neutral-400">{parseFloat(item.lowStockThreshold).toFixed(1)}</span>
                    </td>
                    <td className="py-3 pr-4 text-center">
                      <span className={cn("inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border", statusStyles(status))}>
                        {status === "good" ? "OK" : status === "low" ? "Low" : "Empty"}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="flex items-center border border-neutral-200 rounded-[4px] overflow-hidden">
                          <button
                            onClick={() => stockMutation.mutate({ id: item.id, delta: -1 })}
                            disabled={parseFloat(item.stockQuantity) <= 0}
                            className="p-2 hover:bg-neutral-100 transition-colors disabled:opacity-30"
                          >
                            <Minus className="w-3.5 h-3.5 text-neutral-600" />
                          </button>
                          <span className="px-2 text-xs font-black text-neutral-900 min-w-[20px] text-center">{parseFloat(item.stockQuantity).toFixed(1)}</span>
                          <button
                            onClick={() => stockMutation.mutate({ id: item.id, delta: 1 })}
                            className="p-2 hover:bg-neutral-100 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 text-neutral-600" />
                          </button>
                        </div>
                        <ActionMenu
                          actions={[
                            { label: "Edit", icon: <Edit3 className="w-3.5 h-3.5" />, onClick: () => { setEditingItem(item); setShowEditModal(true); } },
                            { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => setDeleteTarget(item), danger: true },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddItemModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        hotelId={hotelId}
      />

      {editingItem && (
        <EditItemModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingItem(null); }}
          item={editingItem}
          hotelId={hotelId}
        />
      )}

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Item"
        message={`Remove "${deleteTarget?.name}" from inventory?`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </motion.div>
  );
}

function AddItemModal({
  isOpen,
  onClose,
  hotelId,
}: {
  isOpen: boolean;
  onClose: () => void;
  hotelId: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [stockQty, setStockQty] = useState("0");
  const [threshold, setThreshold] = useState("0");

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit,
          stockQuantity: stockQty,
          lowStockThreshold: threshold,
        }),
      });
      if (!res.ok) throw new Error("Failed to add");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", hotelId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock", hotelId] });
      setName("");
      setUnit("");
      setStockQty("0");
      setThreshold("0");
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Inventory Item" description="Create a new stock item">
      <div className="space-y-4">
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-tight"
            placeholder="e.g. Tomatoes"
          />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-tight"
            placeholder="e.g. kg, pcs, L"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Stock Qty</label>
            <input
              type="number"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Low Threshold</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              step="0.1"
            />
          </div>
        </div>
        <button
          onClick={() => addMutation.mutate()}
          disabled={!name || !unit || addMutation.isPending}
          className="w-full py-4 bg-neutral-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Item"}
        </button>
      </div>
    </Modal>
  );
}

function EditItemModal({
  isOpen,
  onClose,
  item,
  hotelId,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem;
  hotelId: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(item.name);
  const [unit, setUnit] = useState(item.unit);
  const [stockQty, setStockQty] = useState(item.stockQuantity);
  const [threshold, setThreshold] = useState(item.lowStockThreshold);

  const editMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/inventory/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          unit,
          stockQuantity: stockQty,
          lowStockThreshold: threshold,
        }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory", hotelId] });
      queryClient.invalidateQueries({ queryKey: ["inventory-low-stock", hotelId] });
      onClose();
    },
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Inventory Item" description="Update item details">
      <div className="space-y-4">
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-tight"
          />
        </div>
        <div>
          <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Unit</label>
          <input
            type="text"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors uppercase tracking-tight"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Stock Qty</label>
            <input
              type="number"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-[9px] font-black uppercase tracking-widest text-neutral-400 mb-1.5">Low Threshold</label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-3 py-3 bg-neutral-50 border border-neutral-200 rounded-[4px] text-xs font-bold text-neutral-900 focus:outline-none focus:border-neutral-900 transition-colors"
              step="0.1"
            />
          </div>
        </div>
        <button
          onClick={() => editMutation.mutate()}
          disabled={!name || !unit || editMutation.isPending}
          className="w-full py-4 bg-neutral-900 text-white rounded-[4px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
        >
          {editMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}
