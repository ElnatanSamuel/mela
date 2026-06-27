"use client";

import React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} description="This cannot be undone">
      <div className="text-center space-y-6">
        {variant === "danger" && (
          <div className="mx-auto w-14 h-14 bg-destructive/10 rounded-full flex items-center justify-center border border-destructive/20">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
        )}
        <p className="text-sm font-bold text-foreground uppercase tracking-tight">
          {message}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full py-4 text-[10px] font-black uppercase tracking-widest rounded-[4px] transition-all flex justify-center items-center gap-2 ${
              variant === "danger"
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                : "bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shadow-lg"
            }`}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : confirmLabel}
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-4 border border-border text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:text-foreground transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
