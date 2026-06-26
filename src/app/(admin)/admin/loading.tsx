import React from "react";

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted-foreground/20 rounded-[4px]" />
        <div className="h-4 w-64 bg-muted rounded-[4px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-[6px] space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-muted rounded-[6px]" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded-[4px]" />
              <div className="h-8 w-24 bg-muted-foreground/20 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-card border border-border rounded-[6px] p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-muted-foreground/20 rounded-[4px]" />
              <div className="h-3 w-16 bg-muted rounded-[4px]" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-muted rounded-[4px]" />
                    <div className="h-2 w-24 bg-muted-foreground/10 rounded-[4px]" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
