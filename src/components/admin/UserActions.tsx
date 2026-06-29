"use client";

import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/lib/actions";
import ActionMenu from "@/components/ui/ActionMenu";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useToastStore } from "@/lib/toast-store";

export function UserRowActions({ 
    id, 
    userId, 
    role, 
    hotelId 
}: { 
    id: string, 
    userId: string, 
    role: string, 
    hotelId?: string 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToastStore();

  async function handleDelete() {
    if (role === 'platform_admin') {
        addToast("Platform Admins cannot be deleted here.", "error");
        return;
    }
    setShowDeleteConfirm(true);
  }

  async function confirmDelete() {
    setIsDeleting(true);
    try {
      await deleteUser(id, userId, hotelId);
      addToast("Staff member deleted", "success");
      setShowDeleteConfirm(false);
    } catch (err: any) {
      addToast(err.message || "Failed to delete", "error");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex justify-end">
      <ActionMenu
        actions={[
          { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: handleDelete, danger: role !== 'platform_admin' },
        ]}
      />
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={confirmDelete}
        title="Delete Staff Member"
        message="They will lose all access. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
