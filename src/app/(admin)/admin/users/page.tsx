import React from "react";
import { db } from "@/db";
import { hotelUsers, hotels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Users, Shield, ChefHat, Crown } from "lucide-react";

export default async function StaffManagementPage() {
  const allUsers = await db
    .select({
      id: hotelUsers.id,
      userId: hotelUsers.userId,
      role: hotelUsers.role,
      hotelName: hotels.name,
      createdAt: hotelUsers.createdAt,
    })
    .from(hotelUsers)
    .leftJoin(hotels, eq(hotels.id, hotelUsers.hotelId));

  const roleIcon: Record<string, React.ReactNode> = {
    platform_admin: <Shield className="w-3.5 h-3.5" />,
    owner: <Crown className="w-3.5 h-3.5" />,
    manager: <Crown className="w-3.5 h-3.5" />,
    waiter: <ChefHat className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase">
          Staff Management
        </h2>
        <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">
          All registered users across the platform
        </p>
      </div>

      <div className="bg-white border border-neutral-200 rounded-[6px] shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            User ID
          </p>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            Role
          </p>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            Hotel
          </p>
          <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
            Joined
          </p>
        </div>

        {/* Table Body */}
        {allUsers.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
            <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest">
              No staff members found
            </p>
          </div>
        ) : (
          allUsers.map((u) => (
            <div
              key={u.id}
              className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <p className="text-xs text-neutral-500 font-mono truncate">
                {u.userId.slice(0, 8)}...
              </p>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-[4px] bg-neutral-100">
                  {roleIcon[u.role] || <Users className="w-3.5 h-3.5" />}
                </div>
                <span className="text-[10px] font-black text-neutral-900 uppercase tracking-widest">
                  {u.role.replace("_", " ")}
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">
                {u.hotelName || "Global"}
              </p>
              <p className="text-xs text-neutral-400">
                {new Date(u.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
