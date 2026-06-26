import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="relative">
        {/* Modern Brutalist Loader */}
        <div className="w-16 h-16 border-[3px] border-neutral-100 rounded-full" />
        <div className="absolute top-0 left-0 w-16 h-16 border-[3px] border-t-neutral-900 border-r-neutral-900 rounded-full animate-spin" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-black uppercase tracking-tighter text-neutral-900">M</span>
        </div>
      </div>
      
      <div className="mt-8 flex flex-col items-center">
        <p className="text-[10px] font-black text-neutral-900 uppercase tracking-[0.3em] animate-pulse">
          Loading
        </p>
        <div className="flex gap-1 mt-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-1 h-1 bg-neutral-900 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
