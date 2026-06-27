"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  QrCode,
  ExternalLink,
  Download,
  Loader2,
  Edit2,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import ActionMenu from "@/components/ui/ActionMenu";

interface Table {
  id: string;
  tableNumber: string;
  hotelSlug: string;
}

interface Assignment {
  id: string;
  userId: string;
  tableId: string;
}

interface StaffMember {
  userId: string;
  role: string;
}

export default function TableManager({ hotelId, settings }: { hotelId: string; settings?: any }) {
  const queryClient = useQueryClient();
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [editTableNumber, setEditTableNumber] = useState("");

  const assignmentEnabled = settings?.enableTableAssignment === true;

  const { data: tables = [], isLoading } = useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: () => fetch("/api/tables").then((res) => res.json()),
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["table-assignments"],
    queryFn: () => fetch("/api/table-assignments").then((r) => r.json()),
    enabled: assignmentEnabled,
  });

  const { data: waiters = [] } = useQuery<StaffMember[]>({
    queryKey: ["hotel-waiters"],
    queryFn: () => fetch("/api/staff/clock-by-name").then((r) => r.json()),
    enabled: assignmentEnabled,
  });

  const assignMutation = useMutation({
    mutationFn: async ({ tableId, userId }: { tableId: string; userId: string }) => {
      const res = await fetch("/api/table-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableId, userId }),
      });
      if (!res.ok) throw new Error("Failed to assign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-assignments"] });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: async (tableId: string) => {
      const res = await fetch(`/api/table-assignments?tableId=${tableId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to unassign");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["table-assignments"] });
    },
  });

  const addTableMutation = useMutation({
    mutationFn: async (tableNumber: string) => {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber }),
      });
      if (!res.ok) throw new Error("Failed to add table");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setNewTableNumber("");
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: async ({ id, tableNumber }: { id: string; tableNumber: string }) => {
      const res = await fetch(`/api/tables/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableNumber }),
      });
      if (!res.ok) throw new Error("Failed to update table");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tables"] });
      setIsEditModalOpen(false);
      setTableToEdit(null);
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

  function getAssignedWaiter(tableId: string): string | null {
    const a = assignments.find((a) => a.tableId === tableId);
    return a?.userId || null;
  }

  const waiterList = waiters.filter((w) => w.role === "waiter");

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center bg-card p-8 rounded-[6px] border border-border shadow-sm dark:shadow-black/10">
        <div>
          <p className="text-xl font-black text-foreground tracking-tighter uppercase">
            Add Table
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Create tables with QR codes for guests.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            type="text"
            placeholder="e.g. Table 10"
            value={newTableNumber}
            onChange={(e) => setNewTableNumber(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newTableNumber) addTableMutation.mutate(newTableNumber); }}
            className="bg-muted border border-border rounded-[4px] px-5 py-3 text-xs font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-foreground transition-all flex-1 md:w-68"
          />
          <button
            onClick={() => addTableMutation.mutate(newTableNumber)}
            disabled={!newTableNumber || addTableMutation.isPending}
            className="bg-primary text-primary-foreground px-8 py-3 rounded-[4px] text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 shadow-lg"
          >
            {addTableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tables.map((table) => {
          const assigned = getAssignedWaiter(table.id);
          return (
            <div
              key={table.id}
              className="bg-card border border-border rounded-[6px] p-6 group hover:border-foreground/30 transition-all shadow-sm dark:shadow-black/10 hover:shadow-md relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 bg-muted rounded-[4px] flex items-center justify-center border border-border group-hover:bg-primary group-hover:border-primary transition-all duration-300">
                  <QrCode className="w-6 h-6 text-muted-foreground group-hover:text-primary-foreground transition-colors" />
                </div>
                <ActionMenu
                  actions={[
                    {
                      label: "Edit",
                      icon: <Edit2 className="w-3.5 h-3.5" />,
                      onClick: () => {
                        setTableToEdit(table);
                        setEditTableNumber(table.tableNumber);
                        setIsEditModalOpen(true);
                      },
                    },
                    { label: "QR", icon: <Download className="w-3.5 h-3.5" />, onClick: () => window.open(`/api/tables/${table.id}/qr`, "_blank") },
                    { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: () => { setTableToDelete(table); setIsDeleteModalOpen(true); }, danger: true },
                  ]}
                />
              </div>

              <div className="mb-4">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                  UUID: {table.id.slice(0, 8)}
                </span>
                <h4 className="text-xl font-black text-foreground tracking-tighter uppercase">
                  {table.tableNumber}
                </h4>
              </div>

              {/* Waiter Assignment */}
              {assignmentEnabled && (
                <div className="mb-4">
                  {assigned ? (
                    <div className="flex items-center justify-between p-2 bg-orange-500/10 border border-orange-500/20 rounded-[4px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <User className="w-3 h-3 text-orange-500 shrink-0" />
                        <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest truncate">
                          {assigned.slice(0, 8)}...
                        </span>
                      </div>
                      <button
                        onClick={() => unassignMutation.mutate(table.id)}
                        className="p-0.5 hover:bg-orange-500/20 rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-orange-500" />
                      </button>
                    </div>
                  ) : (
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          assignMutation.mutate({ tableId: table.id, userId: e.target.value });
                          e.target.value = "";
                        }
                      }}
                      className="w-full p-2 bg-muted border border-dashed border-border rounded-[4px] text-[9px] font-black uppercase tracking-widest text-muted-foreground focus:outline-none focus:border-foreground cursor-pointer"
                    >
                      <option value="">Assign waiter...</option>
                      {waiterList.map((w) => (
                        <option key={w.userId} value={w.userId}>{w.userId.slice(0, 8)}...</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => window.open(`/api/tables/${table.id}/qr`, "_blank")}
                  className="flex items-center justify-center gap-2 bg-muted hover:bg-primary border border-border hover:border-primary text-muted-foreground hover:text-primary-foreground py-3 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Download className="w-3 h-3" />
                  QR
                </button>
                <button
                  onClick={() => window.open(`/guest/${table.hotelSlug}/${table.id}`, "_blank")}
                  className="flex items-center justify-center gap-2 bg-muted hover:bg-primary border border-border hover:border-primary text-muted-foreground hover:text-primary-foreground py-3 rounded-[4px] text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Rename Table"
        description="Change the table number"
      >
        <div className="space-y-6">
          <input
            type="text"
            value={editTableNumber}
            onChange={(e) => setEditTableNumber(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && editTableNumber.trim() && tableToEdit) {
                updateTableMutation.mutate({ id: tableToEdit.id, tableNumber: editTableNumber });
              }
            }}
            className="w-full bg-muted border border-border rounded-[4px] px-4 py-3 text-xs font-black uppercase tracking-widest text-foreground focus:outline-none focus:border-foreground"
            autoFocus
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                if (editTableNumber.trim() && tableToEdit) {
                  updateTableMutation.mutate({ id: tableToEdit.id, tableNumber: editTableNumber });
                }
              }}
              disabled={!editTableNumber.trim() || updateTableMutation.isPending}
              className="w-full py-4 bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:bg-primary/90 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
            >
              {updateTableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
            </button>
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="w-full py-4 border border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Table"
        description="Remove this table permanently"
      >
        <div className="text-center space-y-6">
          <p className="text-sm font-bold text-foreground uppercase tracking-tight">
            Remove &quot;{tableToDelete?.tableNumber}&quot;?
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => deleteTableMutation.mutate(tableToDelete!.id)}
              disabled={deleteTableMutation.isPending}
              className="w-full py-4 bg-destructive text-destructive-foreground text-[10px] font-black uppercase tracking-widest rounded-[4px] hover:bg-destructive/90 transition-all flex justify-center items-center gap-2"
            >
              {deleteTableMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Deletion"}
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              className="w-full py-4 border border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
