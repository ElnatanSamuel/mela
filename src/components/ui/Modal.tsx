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
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white border-2 border-neutral-900 w-full max-w-md shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-[4px] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div className="space-y-0.5">
            <h3 className="text-sm font-black text-neutral-900 uppercase tracking-widest">
              {title}
            </h3>
            {description && (
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                {description}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral-200 rounded transition-colors"
          >
            <X className="w-4 h-4 text-neutral-900" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
