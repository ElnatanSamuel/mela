import React from "react";

export default function MenuManagerSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-neutral-100 rounded-lg"></div>
          <div className="h-4 w-64 bg-neutral-50 rounded-lg"></div>
        </div>
        <div className="h-10 w-32 bg-neutral-100 rounded-xl"></div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 border-b border-neutral-100 pb-px">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-8 w-24 bg-neutral-50 rounded-t-lg"></div>
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-neutral-100 rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="w-full aspect-video bg-neutral-50 rounded-xl"></div>
            <div className="space-y-2">
              <div className="h-5 w-3/4 bg-neutral-100 rounded-lg"></div>
              <div className="h-4 w-1/2 bg-neutral-50 rounded-lg"></div>
            </div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-6 w-16 bg-neutral-100 rounded-full"></div>
              <div className="h-8 w-8 bg-neutral-50 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
