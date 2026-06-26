import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { orders, hotels } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  ShoppingBag,
  Clock,
  Building2,
  CheckCircle2,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

export default async function OrderPulsePage() {
  const recentOrders = await db
    .select({
      id: orders.id,
      total: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
      hotelName: hotels.name,
      hotelSlug: hotels.slug,
      hotelLocation: hotels.location,
    })
    .from(orders)
    .innerJoin(hotels, eq(orders.hotelId, hotels.id))
    .orderBy(desc(orders.createdAt))
    .limit(50);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = recentOrders.filter(
    (o) => new Date(o.createdAt) >= today,
  );
  const dailyTotal = todayOrders.reduce((acc, o) => acc + Number(o.total), 0);

  const stats = [
    {
      label: "Today's Orders",
      value: todayOrders.length,
      icon: ShoppingBag,
    },
    {
      label: "Daily Volume",
      value: formatCurrency(String(dailyTotal)),
      icon: TrendingUp,
    },
    {
      label: "Hotels Today",
      value: [...new Set(recentOrders.map((o) => o.hotelSlug))].length,
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
          Orders
        </h2>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
          Recent orders across all hotels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border p-8 rounded-[6px] shadow-sm relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="p-3 bg-neutral-900 rounded-[6px] w-fit mb-6">
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                {stat.label}
              </p>
              <p className="text-3xl font-black text-foreground tracking-tighter mt-2">
                {stat.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-[6px] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
            Orders
          </h3>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              Live
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Transaction
                </th>
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Hotel
                </th>
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Total
                </th>
                <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Status
                </th>
                <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-border hover:bg-muted transition-colors"
                >
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-foreground uppercase">
                        #{order.id.split("-")[0]}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Link
                      href={`/admin/hotels/${order.hotelSlug}`}
                      className="group/hotel"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center border border-border group-hover/hotel:border-foreground transition-colors">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground group-hover/hotel:text-foreground" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground uppercase tracking-tight group-hover/hotel:underline decoration-2 underline-offset-4">
                            {order.hotelName}
                          </p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-muted-foreground/60" />
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {order.hotelLocation || "Unset"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-black text-foreground">
                      {formatCurrency(order.total)}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-1.5">
                      {order.status === "completed" ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest ${order.status === "completed" ? "text-green-600" : "text-muted-foreground"}`}
                      >
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className="text-[10px] font-black text-foreground uppercase tracking-tighter">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
