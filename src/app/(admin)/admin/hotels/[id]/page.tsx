import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { hotels, hotelUsers, menuItems, orders } from "@/db/schema";
import { eq, count, sum, desc } from "drizzle-orm";
import {
  MapPin,
  Phone,
  Users,
  Utensils,
  ShoppingBag,
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Clock,
  ChevronRight,
  Wallet,
  Globe,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddStaffButton } from "@/components/admin/AddStaffButton";
import { UserRowActions } from "@/components/admin/UserActions";
import { HotelSettingsButton } from "@/components/admin/HotelActions";

export default async function HotelDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: hotelId } = await params;

  const isUuid = hotelId.length === 36 && hotelId.includes("-");
  const [hotel] = await db
    .select()
    .from(hotels)
    .where(isUuid ? eq(hotels.id, hotelId) : eq(hotels.slug, hotelId));
  
  if (!hotel) notFound();

  const staff = await db
    .select({
      id: hotelUsers.id,
      userId: hotelUsers.userId,
      role: hotelUsers.role,
      createdAt: hotelUsers.createdAt,
    })
    .from(hotelUsers)
    .where(eq(hotelUsers.hotelId, hotel.id))
    .orderBy(desc(hotelUsers.role));

  const [menuCount] = await db
    .select({ value: count() })
    .from(menuItems)
    .where(eq(menuItems.hotelId, hotel.id));

  const [orderCount] = await db
    .select({ value: count() })
    .from(orders)
    .where(eq(orders.hotelId, hotel.id));
  const [totalRevenue] = await db
    .select({ value: sum(orders.totalAmount) })
    .from(orders)
    .where(eq(orders.hotelId, hotel.id));

  const recentOrders = await db
    .select()
    .from(orders)
    .where(eq(orders.hotelId, hotel.id))
    .orderBy(desc(orders.createdAt))
    .limit(8);

  const stats = [
    {
      label: "Total Revenue",
      value: `ETB ${Number(totalRevenue?.value || 0).toLocaleString()}`,
      icon: Wallet,
      trend: "+12.5%",
    },
    {
      label: "Total Orders",
      value: orderCount.value,
      icon: ShoppingBag,
      trend: "Live",
    },
    {
      label: "Menu Items",
      value: menuCount.value,
      icon: Utensils,
      trend: "Items",
    },
    {
      label: "Staff Members",
      value: staff.length,
      icon: Users,
      trend: "Active",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 -m-8">
      <div className="relative h-[300px] w-full overflow-hidden bg-neutral-900">
        {hotel.bannerUrl ? (
          <img
            src={hotel.bannerUrl}
            alt=""
            className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-700"
          />
        ) : (
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-200 to-neutral-400 opacity-20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-100 via-transparent to-transparent" />

        <div className="absolute top-8 left-8 flex items-center gap-4 z-20">
          <Link
            href="/admin/hotels"
            className="p-3 bg-white backdrop-blur-md border border-white/20 rounded-[6px] text-white hover:bg-white hover:text-black transition-all shadow-lg"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
          </Link>
        </div>

        <div className="absolute bottom-0 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between pb-8 gap-6">
          <div className="flex items-center gap-8">
            {hotel.logoUrl ? (
              <div className="w-24 h-24 md:w-32 md:h-32 bg-white rounded-[20px] p-4 shadow-lg flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform duration-500">
                <img
                  src={hotel.logoUrl}
                  alt={hotel.name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-white rounded-[6px] flex items-center justify-center border border-white/10">
                <Building2 className="w-10 h-10 text-neutral-600" />
              </div>
            )}

            <div className="space-y-6">
              <div className="flex items-center gap-6 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
                  {hotel.name}
                </h1>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-white/60" />
                  <span className="text-[11px] font-black text-white uppercase tracking-widest">
                    {hotel.location || "Addis Ababa, Ethiopia"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <p className="text-white text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-white" />
                  Expires:{" "}
                  <span className="text-white">
                    {hotel.subscriptionExpiresAt
                      ? new Date(
                          hotel.subscriptionExpiresAt,
                        ).toLocaleDateString()
                      : "Lifetime Access"}
                  </span>
                </p>
                <p className="text-white text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-white" />
                  {hotel.slug}.mela.et
                </p>
                <p className="text-white text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-white" />
                  {hotel.phone || "+251 900 000 000"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pb-2">
            <Link
              href={`/guest/${hotel.slug}/default`}
              target="_blank"
              className="px-8 py-4 bg-white text-black rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:bg-neutral-200 transition-all flex items-center gap-3 shadow-lg group"
            >
              <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              View Hotel
            </Link>
            <HotelSettingsButton hotel={hotel as any} />
          </div>
        </div>
      </div>

      <div className="px-8 pt-12 space-y-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="group relative bg-card border border-border p-8 rounded-[6px] shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
            >
              <div className="relative z-10">
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  {stat.label}
                </p>
                <p className="text-3xl font-black text-foreground tracking-tighter mt-2">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-card border border-border rounded-[6px] overflow-hidden shadow-sm">
              <div className="px-8 py-6 border-b border-border flex justify-between items-center bg-muted/50">
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
                    Recent Orders
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Recent orders
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted">
                    <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Order Details
                    </th>
                    <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Amount
                    </th>
                    <th className="text-left px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Status
                    </th>
                    <th className="text-right px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-border hover:bg-muted transition-colors cursor-pointer"
                    >
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-2 h-2 rounded-full bg-foreground" />
                            <div>
                              <p className="text-xs font-black text-foreground uppercase">
                                #{order.id.slice(0, 8)}
                              </p>
                              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                Table {order.tableId?.slice(0, 4)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-black text-foreground">
                            ETB {Number(order.totalAmount).toLocaleString()}
                          </p>
                          <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                            Total
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`px-2 py-1 rounded-[4px] text-[8px] font-black uppercase tracking-widest border ${
                              order.status === "completed"
                                ? "bg-green-50 text-green-600 border-green-100"
                                : order.status === "pending"
                                  ? "bg-muted text-muted-foreground border-border"
                                  : "bg-muted text-muted-foreground border-border"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <p className="text-[10px] font-black text-foreground uppercase">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">
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

          <div className="lg:col-span-4 space-y-8">
            <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                    Subscription
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Plan
                  </p>
                </div>
                <div className="p-2 bg-neutral-900 rounded-[6px]">
                  <ShieldCheck className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                    Current Plan
                  </p>
                  <p className="text-xl font-black text-foreground uppercase tracking-tight">
                    {hotel.subscriptionPlan}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                      Status
                    </p>
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-widest border border-green-100 rounded-full">
                      Active
                    </span>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1">
                      Expires In
                    </p>
                    <p className="text-xs font-black text-foreground uppercase">
                      {hotel.subscriptionExpiresAt
                        ? `${Math.ceil((new Date(hotel.subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} Days`
                        : "Forever"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
                    Staff
                  </h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Team members
                  </p>
                </div>
                <AddStaffButton
                  hotelsList={[{ id: hotel.id, name: hotel.name }]}
                  defaultHotelId={hotel.id}
                  compact
                />
              </div>
              <div className="space-y-4">
                {staff.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 bg-muted rounded-[6px] border border-border group"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-[6px] flex items-center justify-center text-[10px] font-black uppercase ${
                          member.role === "owner"
                            ? "bg-primary/10 text-primary"
                            : member.role === "manager"
                              ? "bg-primary/10 text-primary"
                              : "bg-muted-foreground/20 text-muted-foreground"
                        }`}
                      >
                        {member.role === "owner" ? (
                          <ShieldCheck className="w-4 h-4" />
                        ) : (
                          <Users className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-tight">
                          ID: {member.userId.slice(0, 8)}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground bg-card px-2 py-0.5 rounded-full border border-border">
                            {member.role}
                          </span>
                        </div>
                      </div>
                    </div>
                    <UserRowActions
                      id={member.id}
                      userId={member.userId}
                      role={member.role}
                      hotelId={hotelId}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neutral-900 text-white rounded-[6px] p-8 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full transform translate-x-16 -translate-y-16 group-hover:scale-110 transition-transform duration-700" />
              <h3 className="text-xs font-black uppercase tracking-widest mb-8 flex items-center gap-3">
                Financial Info
              </h3>
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                    VAT / TIN Number
                  </p>
                  <p className="text-lg font-black tracking-tight">
                    {hotel.vatNumber || "Not Set"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                      VAT Rate
                    </p>
                    <p className="text-lg font-black tracking-tight">
                      {(hotel.settings as any)?.vatRate * 100 || 15}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                      Service Charge
                    </p>
                    <p className="text-lg font-black tracking-tight">
                      {(hotel.settings as any)?.serviceChargeRate * 100 || 10}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm">
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest mb-6">
                Contact Info
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-[4px] mt-1">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-foreground uppercase">
                      Phone Number
                    </p>
                    <p className="text-xs font-bold text-muted-foreground mt-0.5">
                      {hotel.phone || "Not Set"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-muted rounded-[4px] mt-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-foreground uppercase">
                      Location
                    </p>
                    <p className="text-xs font-bold text-muted-foreground mt-0.5">
                      {hotel.location || "Not Set"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
