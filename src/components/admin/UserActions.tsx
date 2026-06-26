"use client";

import React from "react";
import { Trash2 } from "lucide-react";
import { deleteUser } from "@/lib/actions";
import ActionMenu from "@/components/ui/ActionMenu";

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
  async function handleDelete() {
    if (role === 'platform_admin') {
        alert("Platform Admins cannot be deleted here.");
        return;
    }

    if (confirm("Delete this staff member? They will lose all access.")) {
        await deleteUser(id, userId, hotelId);
    }
  }

  return (
    <div className="flex justify-end">
      <ActionMenu
        actions={[
          { label: "Delete", icon: <Trash2 className="w-3.5 h-3.5" />, onClick: handleDelete, danger: role !== 'platform_admin' },
        ]}
      />
    </div>
  );
}
