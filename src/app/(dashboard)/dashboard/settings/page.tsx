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

export default async function ManagerSettingsPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) notFound();

  const [hotel] = await db.select().from(hotels).where(eq(hotels.id, roleInfo.hotelId));
  if (!hotel) notFound();

  const settings = (hotel.settings as any) || { vatRate: 0.15, serviceChargeRate: 0.10 };

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase">Settings</h2>
        <p className="text-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Update your hotel info</p>
      </div>

      <form action={updateHotel.bind(null, hotel.id)} className="space-y-12">
        <div className="bg-white border border-neutral-200 rounded-[12px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <ImageIcon className="w-4 h-4 text-neutral-900" />
            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Logo & Banner</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Hotel Logo</label>
              <div className="flex flex-col border border-neutral-200 rounded-[12px] p-6 bg-neutral-50/50 space-y-4">
                <div className="flex items-center justify-center p-4 bg-white border border-neutral-100 rounded-[8px] h-32">
                  {hotel.logoUrl ? (
                    <img src={hotel.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain rounded-[4px]" />
                  ) : (
                    <Building2 className="w-12 h-12 text-neutral-200" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-neutral-400">External URL</p>
                    <input 
                      name="logoUrlInput" 
                      placeholder="https://..."
                      defaultValue={hotel.logoUrl || ""}
                      className="w-full p-3 border border-neutral-200 rounded-[4px] text-[10px] font-bold focus:outline-none focus:border-neutral-900 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <p className="text-[8px] font-black uppercase text-neutral-400 mb-1">Or Upload File</p>
                    <input type="file" name="logoFile" className="w-full text-[9px] text-neutral-400 font-bold uppercase cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-[4px] file:border-0 file:text-[8px] file:font-black file:bg-neutral-900 file:text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Hero Banner</label>
              <div className="flex flex-col border border-neutral-200 rounded-[12px] p-6 bg-neutral-50/50 space-y-4">
                <div className="flex items-center justify-center bg-white border border-neutral-100 rounded-[8px] h-32 overflow-hidden">
                  {hotel.bannerUrl ? (
                    <img src={hotel.bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-12 h-12 text-neutral-200" />
                  )}
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <p className="text-[8px] font-black uppercase text-neutral-400">External URL</p>
                    <input 
                      name="bannerUrlInput" 
                      placeholder="https://..."
                      defaultValue={hotel.bannerUrl || ""}
                      className="w-full p-3 border border-neutral-200 rounded-[4px] text-[10px] font-bold focus:outline-none focus:border-neutral-900 bg-white"
                    />
                  </div>
                  <div className="relative">
                    <p className="text-[8px] font-black uppercase text-neutral-400 mb-1">Or Upload File</p>
                    <input type="file" name="bannerFile" className="w-full text-[9px] text-neutral-400 font-bold uppercase cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-[4px] file:border-0 file:text-[8px] file:font-black file:bg-neutral-900 file:text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-[12px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-neutral-900" />
            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">General</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Name</label>
              <input 
                name="name" 
                defaultValue={hotel.name}
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900 text-neutral-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Phone</label>
              <input 
                name="phone" 
                defaultValue={hotel.phone || ""}
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900 text-neutral-900"
              />
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Location</label>
              <input 
                name="location" 
                defaultValue={hotel.location || ""}
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900 text-neutral-900"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-[12px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <Calculator className="w-4 h-4 text-neutral-900" />
            <h3 className="text-xs font-black text-neutral-900 uppercase tracking-widest">Financial Info</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">VAT Number</label>
              <input 
                name="vatNumber" 
                defaultValue={hotel.vatNumber || ""}
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-neutral-900 text-neutral-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">VAT Rate (e.g. 0.15)</label>
              <input 
                name="vatRate" 
                type="number"
                step="0.01"
                defaultValue={settings.vatRate}
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900 text-neutral-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Service Charge (e.g. 0.10)</label>
              <input 
                name="serviceChargeRate" 
                type="number"
                step="0.01"
                defaultValue={settings.serviceChargeRate}
                className="w-full p-4 border border-neutral-200 rounded-[4px] text-xs font-bold focus:outline-none focus:border-neutral-900 text-neutral-900"
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

      <ReceiptSettings />
    </div>
  );
}
