import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { hotels } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserRole } from "@/lib/auth-utils";
import { notFound } from "next/navigation";
import { 
  Building2, 
  Image as ImageIcon, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Save, 
  Info,
  BadgePercent,
  Calculator
} from "lucide-react";
import { updateHotel } from "@/lib/actions";
import SubmitButton from "@/components/common/SubmitButton";
import ReceiptSettings from "@/components/dashboard/ReceiptSettings";
import ActiveSessions from "@/components/dashboard/ActiveSessions";
import SettingsToggles from "@/components/dashboard/SettingsToggles";
import { ClockLinkManager } from "@/components/dashboard/ClockLinkManager";

export default async function ManagerSettingsPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) notFound();

  const [hotel] = await db.select().from(hotels).where(eq(hotels.id, roleInfo.hotelId));
  if (!hotel) notFound();

  const settings = (hotel.settings as any) || { vatRate: 0.15, serviceChargeRate: 0.10 };

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">Settings</h2>
        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">Update your hotel info</p>
      </div>

      <form action={updateHotel.bind(null, hotel.id)} className="space-y-12">
        <div className="bg-card border border-border rounded-[12px] p-8 shadow-sm dark:shadow-black/10 space-y-8">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Logo & Banner</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hotel Logo</label>
              <div className="flex flex-col border border-border rounded-[12px] p-6 bg-muted space-y-4">
                <div className="flex items-center justify-center p-4 bg-card border border-border rounded-[8px] h-32">
                  {hotel.logoUrl ? (
                    <img src={hotel.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain rounded-[4px]" />
                  ) : (
                    <Building2 className="w-12 h-12 text-muted-foreground/30" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">External URL</p>
                    <input 
                      name="logoUrlInput" 
                      placeholder="https://..."
                      defaultValue={hotel.logoUrl || ""}
                      className="w-full p-3 border border-border rounded-[4px] text-[10px] font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
                    />
                  </div>
                  <div className="relative">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Or Upload File</p>
                    <input type="file" name="logoFile" className="w-full text-[9px] text-muted-foreground font-bold uppercase cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-[4px] file:border-0 file:text-[8px] file:font-black file:bg-foreground file:text-background" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hero Banner</label>
              <div className="flex flex-col border border-border rounded-[12px] p-6 bg-muted space-y-4">
                <div className="flex items-center justify-center bg-card border border-border rounded-[8px] h-32 overflow-hidden">
                  {hotel.bannerUrl ? (
                    <img src={hotel.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-muted-foreground/30" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-muted-foreground">External URL</p>
                    <input 
                      name="bannerUrlInput" 
                      placeholder="https://..."
                      defaultValue={hotel.bannerUrl || ""}
                      className="w-full p-3 border border-border rounded-[4px] text-[10px] font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
                    />
                  </div>
                  <div className="relative">
                    <p className="text-[8px] font-black uppercase text-muted-foreground mb-1">Or Upload File</p>
                    <input type="file" name="bannerFile" className="w-full text-[9px] text-muted-foreground font-bold uppercase cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-[4px] file:border-0 file:text-[8px] file:font-black file:bg-foreground file:text-background" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[12px] p-8 shadow-sm dark:shadow-black/10 space-y-8">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">General</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Name</label>
              <input 
                name="name" 
                defaultValue={hotel.name}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground text-foreground bg-card"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Phone</label>
              <input 
                name="phone" 
                defaultValue={hotel.phone || ""}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground text-foreground bg-card"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Location</label>
              <input 
                name="location" 
                defaultValue={hotel.location || ""}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground text-foreground bg-card"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[12px] p-8 shadow-sm dark:shadow-black/10 space-y-8">
          <div className="flex items-center gap-3">
            <Calculator className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Financial Info</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">VAT Number</label>
              <input 
                name="vatNumber" 
                defaultValue={hotel.vatNumber || ""}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground text-foreground bg-card"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">VAT Rate (e.g. 0.15)</label>
              <input 
                name="vatRate" 
                type="number"
                step="0.01"
                defaultValue={settings.vatRate}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground text-foreground bg-card"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Charge (e.g. 0.10)</label>
              <input 
                name="serviceChargeRate" 
                type="number"
                step="0.01"
                defaultValue={settings.serviceChargeRate}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground text-foreground bg-card"
              />
            </div>
          </div>

          <input type="hidden" name="subscriptionPlan" value={hotel.subscriptionPlan} />
          <input type="hidden" name="subscriptionPlanId" value={hotel.subscriptionPlanId || ""} />
          <input type="hidden" name="subscriptionExpiresAt" value={hotel.subscriptionExpiresAt?.toISOString() || ""} />
        </div>

        <div className="flex justify-end pb-20 pt-8">
          <SubmitButton loadingText="Updating Identity...">
            <Save className="w-4 h-4" />
            Save Changes
          </SubmitButton>
        </div>
      </form>

      <SettingsToggles hotelId={hotel.id} settings={settings} />

      {/* Access PINs */}
      <form action={updateHotel.bind(null, hotel.id)} className="bg-card border border-border rounded-[12px] p-8 shadow-sm dark:shadow-black/10 space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Access PINs</h3>
        </div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
          Set separate PINs for clock in and kitchen display access.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Clock In PIN</label>
            <input
              name="clockPin"
              type="password"
              maxLength={6}
              defaultValue={settings.clockPin || "1234"}
              className="w-full p-4 border border-border rounded-[4px] text-xs font-bold tracking-[0.5em] font-mono focus:outline-none focus:border-foreground text-foreground bg-card"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kitchen Display PIN</label>
            <input
              name="kitchenPin"
              type="password"
              maxLength={6}
              defaultValue={settings.kitchenPin || "1234"}
              className="w-full p-4 border border-border rounded-[4px] text-xs font-bold tracking-[0.5em] font-mono focus:outline-none focus:border-foreground text-foreground bg-card"
            />
          </div>
        </div>
        <input type="hidden" name="vatRate" value={settings.vatRate} />
        <input type="hidden" name="serviceChargeRate" value={settings.serviceChargeRate} />
        <input type="hidden" name="subscriptionPlan" value={hotel.subscriptionPlan} />
        <input type="hidden" name="subscriptionPlanId" value={hotel.subscriptionPlanId || ""} />
        <input type="hidden" name="subscriptionExpiresAt" value={hotel.subscriptionExpiresAt?.toISOString() || ""} />
        <div className="flex justify-end">
          <SubmitButton loadingText="Saving...">
            <Save className="w-4 h-4" />
            Save PINs
          </SubmitButton>
        </div>
      </form>

      <ClockLinkManager hotelSlug={hotel.slug || hotel.name.toLowerCase().replace(/\s+/g, "-")} hotelName={hotel.name} clockToken={hotel.clockToken} kitchenToken={hotel.kitchenToken} waiterToken={hotel.kitchenToken} />

      <ReceiptSettings />

      <ActiveSessions />
    </div>
  );
}
