"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  children?: React.ReactNode;
  className?: string;
  loadingText?: string;
}

export default function SubmitButton({ 
  children, 
  className, 
  loadingText = "Saving..." 
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "flex items-center justify-center gap-3 px-12 py-5 bg-neutral-900 text-white rounded-[8px] text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-2xl active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed",
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {children || (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </>
      )}
    </button>
  );
}
