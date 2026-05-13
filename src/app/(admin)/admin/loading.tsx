import React from "react";

export default function AdminLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-neutral-200 rounded-[4px]" />
        <div className="h-4 w-64 bg-neutral-100 rounded-[4px]" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white border border-neutral-200 p-6 rounded-[6px] space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 bg-neutral-100 rounded-[6px]" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-neutral-100 rounded-[4px]" />
              <div className="h-8 w-24 bg-neutral-200 rounded-[4px]" />
            </div>
          </div>
        ))}
      </div>

      {/* Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-[6px] p-6 space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-4 w-32 bg-neutral-200 rounded-[4px]" />
              <div className="h-3 w-16 bg-neutral-100 rounded-[4px]" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-neutral-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-full bg-neutral-100 rounded-[4px]" />
                    <div className="h-2 w-24 bg-neutral-50 rounded-[4px]" />
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
