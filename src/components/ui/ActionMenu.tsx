"use client";
import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface Action {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  actions: Action[];
}

export default function ActionMenu({ actions }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-[6px] shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
          {actions.map((a, i) => (
            <button
              key={i}
              onClick={() => { a.onClick(); setOpen(false); }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all",
                a.danger
                  ? "text-destructive hover:bg-destructive/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {a.icon}
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
