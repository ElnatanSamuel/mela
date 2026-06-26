import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { hotels, systemSettings } from "@/db/schema";
import { desc } from "drizzle-orm";
import { 
  TrendingUp, 
  Clock, 
  ShieldCheck, 
  Coins,
  Settings
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { SubscriptionTable } from "@/components/admin/SubscriptionManagement";
import Link from "next/link";

export default async function SubscriptionsDashboard() {
  const [settings] = await db.select().from(systemSettings).limit(1);

  const hotelsWithSubs = await db.select().from(hotels).orderBy(desc(hotels.createdAt));

  const activeSubsCount = hotelsWithSubs.filter(h => {
    if (!h.subscriptionExpiresAt) return true;
    return new Date(h.subscriptionExpiresAt) > new Date();
  }).length;

  const totalMRR = activeSubsCount * Number(settings?.subscriptionPrice || 0);

  const expiringSoon = hotelsWithSubs.filter(h => {
    if (!h.subscriptionExpiresAt) return false;
    const diff = new Date(h.subscriptionExpiresAt).getTime() - new Date().getTime();
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
  }).length;

  const stats = [
    { label: "Active Subscriptions", value: activeSubsCount, icon: ShieldCheck },
    { label: "Monthly Revenue", value: formatCurrency(String(totalMRR)), icon: TrendingUp },
    { label: "Expiring Soon", value: expiringSoon, icon: Clock },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
            Subscriptions
          </h2>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Manage hotel subscriptions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-card border border-border p-8 rounded-[6px] shadow-sm relative overflow-hidden group">
            <div className="relative z-10">
              <div className="p-3 bg-neutral-900 rounded-[6px] w-fit mb-6">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-foreground tracking-tighter mt-2">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <SubscriptionTable hotels={hotelsWithSubs} />
        </div>

        <div className="lg:col-span-4">
          <div className="bg-neutral-900 text-white rounded-[6px] p-8 shadow-lg relative overflow-hidden group h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative z-10 space-y-8">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em]">Pricing</h3>
                <p className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest mt-1">Per hotel</p>
              </div>

              <div className="p-8 bg-white/5 border border-white/10 rounded-[6px] text-center">
                <p className="text-4xl font-black tracking-tighter mb-2">{formatCurrency(settings?.subscriptionPrice || "0")}</p>
                <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em]">Per {settings?.subscriptionCycle || 'Month'}</p>
              </div>

              <div className="space-y-4">
                <Link 
                  href="/admin/settings"
                  className="flex items-center justify-center gap-3 w-full py-4 bg-white text-black rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all shadow-lg"
                >
                  <Settings className="w-4 h-4" />
                  Change Price
                </Link>
                <p className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest text-center px-4">
                  Price changes apply to all hotels and are logged.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
