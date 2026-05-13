import React from "react";

export default function Loading() {
  return (
    <div className="space-y-12 animate-pulse">
      <section>
        <div className="flex justify-between items-end mb-8">
          <div className="space-y-2">
            <div className="h-9 w-48 bg-neutral-100 rounded-lg"></div>
            <div className="h-4 w-64 bg-neutral-50 rounded-lg"></div>
          </div>
          <div className="h-8 w-24 bg-neutral-100 rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          <div className="bg-white border border-neutral-200 rounded-3xl p-8 h-64">
            <div className="h-4 w-32 bg-neutral-100 rounded mb-8"></div>
            <div className="grid grid-cols-4 gap-4">
               {[1,2,3,4].map(i => <div key={i} className="h-32 bg-neutral-50 rounded-2xl"></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="pt-12 border-t border-neutral-200">
        <div className="h-8 w-48 bg-neutral-100 rounded-lg mb-8"></div>
        <div className="grid grid-cols-4 gap-6">
           {[1,2,3,4].map(i => <div key={i} className="h-40 bg-neutral-100 rounded-3xl"></div>)}
        </div>
      </section>
    </div>
  );
}
