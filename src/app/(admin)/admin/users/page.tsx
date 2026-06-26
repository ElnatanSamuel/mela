import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { hotelUsers, hotels } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Users, Shield, ChefHat, Building2, UserCheck } from "lucide-react";
import { UserRowActions } from "@/components/admin/UserActions";
import { AddStaffButton } from "@/components/admin/AddStaffButton";

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
    .leftJoin(hotels, eq(hotels.id, hotelUsers.hotelId))
    .orderBy(desc(hotelUsers.createdAt));

  const hotelsList = await db.select({ id: hotels.id, name: hotels.name }).from(hotels);

  const roleIcon: Record<string, React.ReactNode> = {
    platform_admin: <Shield className="w-3.5 h-3.5" />,
    owner: <Building2 className="w-3.5 h-3.5" />,
    manager: <UserCheck className="w-3.5 h-3.5" />,
    waiter: <ChefHat className="w-3.5 h-3.5" />,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
            Staff
          </h2>
          <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest mt-1">
            Manage staff across all hotels
          </p>
        </div>
        <AddStaffButton hotelsList={hotelsList} />
      </div>

      <div className="overflow-x-auto rounded-[6px] border border-border">
        {allUsers.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <Users className="w-10 h-10 text-muted mx-auto mb-4" />
            <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
              No staff members registered
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">User ID</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Role</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hotel</th>
                <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Added</th>
                <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.map((u) => (
                <tr key={u.id} className="border-b border-border hover:bg-muted transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <p className="text-xs font-mono font-bold text-foreground tracking-tighter">
                        {u.userId?.slice(0, 8) || 'N/A'}...
                      </p>
                    </div>
                  </td>
                  
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-[4px] ${u.role === 'platform_admin' ? 'bg-neutral-900 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {roleIcon[u.role] || <Users className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[10px] font-black text-foreground uppercase tracking-widest">
                        {u.role?.replace("_", " ")}
                      </span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {u.hotelName || "Platform"}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <UserRowActions id={u.id} userId={u.userId} role={u.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
