"use client";

import React from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  description?: string;
}

export function Modal({ isOpen, onClose, title, children, description }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-border w-full max-w-md shadow-xl rounded-[6px] overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between bg-muted">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
              {title}
            </h3>
            {description && (
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                {description}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-muted-foreground/10 rounded transition-colors"
          >
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
