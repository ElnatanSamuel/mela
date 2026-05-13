import React from "react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-9 w-72 bg-neutral-100 rounded-lg"></div>
        <div className="h-4 w-96 bg-neutral-50 rounded-lg mt-2"></div>
      </div>
      
      <div className="bg-white border border-neutral-200 rounded-3xl p-8 h-40 flex justify-between items-center">
        <div className="space-y-3">
          <div className="h-4 w-32 bg-neutral-100 rounded"></div>
          <div className="h-8 w-48 bg-neutral-100 rounded-lg"></div>
          <div className="h-4 w-64 bg-neutral-50 rounded"></div>
        </div>
        <div className="flex gap-2">
           <div className="h-12 w-48 bg-neutral-50 rounded-2xl"></div>
           <div className="h-12 w-16 bg-neutral-100 rounded-2xl"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-3xl p-8 h-72 space-y-8">
            <div className="flex justify-between items-start">
              <div className="w-14 h-14 bg-neutral-50 rounded-2xl"></div>
              <div className="w-8 h-8 bg-neutral-50 rounded-xl"></div>
            </div>
            <div className="space-y-3">
              <div className="h-3 w-20 bg-neutral-50 rounded"></div>
              <div className="h-8 w-32 bg-neutral-100 rounded-lg"></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-neutral-50 rounded-2xl"></div>
              <div className="h-10 bg-neutral-50 rounded-2xl"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
