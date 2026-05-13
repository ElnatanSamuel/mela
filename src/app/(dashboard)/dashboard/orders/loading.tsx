import React from "react";

export default function Loading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div>
        <div className="h-9 w-64 bg-neutral-100 rounded-lg"></div>
        <div className="h-4 w-80 bg-neutral-50 rounded-lg mt-2"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-white border border-neutral-200 rounded-2xl p-6 h-64 space-y-6">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-neutral-50 rounded-xl"></div>
                 <div className="space-y-2">
                   <div className="h-3 w-16 bg-neutral-100 rounded"></div>
                   <div className="h-4 w-20 bg-neutral-100 rounded"></div>
                 </div>
               </div>
               <div className="h-6 w-16 bg-neutral-50 rounded-full"></div>
            </div>
            <div className="space-y-3">
              <div className="h-3 w-24 bg-neutral-50 rounded"></div>
              <div className="h-12 w-full bg-neutral-50 rounded-xl"></div>
            </div>
            <div className="h-12 w-full bg-neutral-100 rounded-xl pt-4"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
