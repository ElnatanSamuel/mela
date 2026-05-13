"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  QrCode,
  Trash2,
  ExternalLink,
  Download,
  Loader2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Table {
  id: string;
  tableNumber: string;
  hotelSlug: string;
}

export default function TableManager({ hotelId }: { hotelId: string }) {
  const queryClient = useQueryClient();
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () => fetch("/api/tables").then((res) => res.json()),
  });

  const addTableMutation = useMutation({
    mutationFn: async (tableNumber: string) => {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setNewTableNumber("");
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setIsDeleteModalOpen(false);
      setTableToDelete(null);
    },
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-white p-8 rounded-[6px] border border-neutral-200 shadow-sm">
        <div>
          <p className="text-xl font-black text-neutral-900 tracking-tighter uppercase">
            Provision Table
          </p>
          <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1">
            Generate unique identity and QR orchestrator.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="E.G. TABLE 10"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            className="bg-neutral-50 border border-neutral-200 rounded-[4px] px-5 py-3 text-xs font-black uppercase tracking-widest text-neutral-900 focus:outline-none focus:border-neutral-900 transition-all flex-1 md:w-68"
          />
          <button
            onClick={() => addTableMutation.mutate(newTableNumber)}
            disabled={!newTableNumber || addTableMutation.isPending}
            className="bg-neutral-900 text-white px-8 py-3 rounded-[4px] text-xs font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 shadow-lg shadow-neutral-200"
          >
            {addTableMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div
            key={table.id}
            className="bg-white border border-neutral-200 rounded-[6px] p-8 group hover:border-neutral-900 transition-all shadow-sm hover:shadow-md relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-8">
              <div className="w-14 h-14 bg-neutral-50 rounded-[4px] flex items-center justify-center border border-neutral-100 group-hover:bg-neutral-900 group-hover:border-neutral-900 transition-all duration-300">
                <QrCode className="w-7 h-7 text-neutral-300 group-hover:text-white transition-colors" />
              </div>
              <button
                onClick={() => {
                  setTableToDelete(table);
                  setIsDeleteModalOpen(true);
                }}
                disabled={deleteTableMutation.isPending}
                className="p-2 text-neutral-200 hover:text-red-500 hover:bg-red-50 rounded-[4px] transition-all disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-8">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-300">
                UUID: {table.id.slice(0, 8)}
              </span>
              <h4 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase">
                {table.tableNumber}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => window.open(`/api/tables/${table.id}/qr`, "_blank")}
                className="flex items-center justify-center gap-2 bg-neutral-50 hover:bg-neutral-900 border border-neutral-100 hover:border-neutral-900 text-neutral-600 hover:text-white py-3 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Download className="w-3 h-3" />
                QR
              </button>
              <button
                onClick={() => window.open(`/guest/${table.hotelSlug}/${table.id}`, "_blank")}
                className="flex items-center justify-center gap-2 bg-neutral-50 hover:bg-neutral-900 border border-neutral-100 hover:border-neutral-900 text-neutral-600 hover:text-white py-3 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Table"
        description="Permanently remove QR orchestrator"
      >
        <div className="text-center space-y-6">
          <p className="text-sm font-bold text-neutral-900 uppercase tracking-tight">
            Remove "{tableToDelete?.tableNumber}"?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => deleteTableMutation.mutate(tableToDelete!.id)}
              disabled={deleteTableMutation.isPending}
              className="w-full py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:bg-red-700 transition-all flex justify-center items-center gap-2"
            >
              {deleteTableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Deletion"}
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full py-4 border border-neutral-200 text-neutral-400 text-[10px] font-black uppercase tracking-widest hover:text-neutral-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
