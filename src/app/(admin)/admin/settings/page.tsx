import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { systemSettings } from "@/db/schema";
import { 
  Globe, 
  Mail, 
  Info, 
  Save, 
  Percent,
  Phone,
  Coins,
  Calendar,
} from "lucide-react";
import { updateSystemSettings } from "@/lib/actions";

export default async function SettingsPage() {
  const [settings] = await db.select().from(systemSettings).limit(1);

  return (
    <div className="max-w-4xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
            Platform Settings
          </h2>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            System-wide defaults
          </p>
        </div>
      </div>

      <form action={updateSystemSettings} className="space-y-8">
        <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-4 h-4 text-foreground" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Brand</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Platform Name</label>
              <input 
                name="platformName" 
                defaultValue={settings?.platformName} 
                required 
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Currency</label>
              <div className="relative">
                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <input 
                  name="currency" 
                  defaultValue={settings?.currency || "ETB"} 
                  className="w-full p-4 pl-11 border border-border rounded-[4px] text-xs font-bold uppercase focus:outline-none focus:border-foreground bg-card text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-foreground" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Support</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Support Email</label>
              <input 
                name="supportEmail" 
                defaultValue={settings?.supportEmail || ""} 
                type="email"
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Support Phone</label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                <input 
                  name="supportPhone" 
                  defaultValue={settings?.supportPhone || ""} 
                  className="w-full p-4 pl-11 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <Percent className="w-4 h-4 text-foreground" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Default Rates</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">VAT Rate (e.g. 0.15)</label>
              <input 
                name="globalVatRate" 
                step="0.01"
                type="number"
                defaultValue={settings?.globalVatRate} 
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Charge (e.g. 0.10)</label>
              <input 
                name="globalServiceCharge" 
                step="0.01"
                type="number"
                defaultValue={settings?.globalServiceCharge} 
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <Coins className="w-4 h-4 text-foreground" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Subscription Pricing</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Service Price (ETB)</label>
              <input 
                name="subscriptionPrice" 
                type="number"
                step="0.01"
                defaultValue={settings?.subscriptionPrice} 
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Billing Cycle</label>
              <select 
                name="subscriptionCycle" 
                defaultValue={settings?.subscriptionCycle}
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground bg-card text-foreground"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-foreground" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Subscription Rules</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Free Trial Days</label>
              <input 
                name="trialDays" 
                type="number"
                defaultValue={settings?.trialDays} 
                className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted rounded-[4px] border border-border">
              <div>
                <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Self Signup</p>
                <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Let hotels register on their own</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  name="allowSelfOnboarding" 
                  type="checkbox" 
                  defaultChecked={settings?.allowSelfOnboarding} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-muted-foreground/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm space-y-8">
          <div className="flex items-center gap-3">
            <Globe className="w-4 h-4 text-foreground" />
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">Maintenance</h3>
          </div>

          <div className="flex items-center justify-between p-6 bg-destructive/5 border border-destructive/20 rounded-[6px] group hover:bg-destructive transition-all duration-500">
            <div>
              <p className="text-[10px] font-black text-destructive uppercase tracking-widest group-hover:text-destructive-foreground text-left">Maintenance Mode</p>
              <p className="text-[9px] font-bold text-destructive/70 uppercase tracking-widest mt-1 group-hover:text-destructive-foreground/80 text-left">Stops all guest menus and ordering</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                name="maintenanceMode" 
                type="checkbox" 
                defaultChecked={settings?.maintenanceMode} 
                className="sr-only peer" 
              />
              <div className="w-14 h-8 bg-destructive/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-card after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-destructive"></div>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button 
            type="submit"
            className="px-10 py-5 bg-neutral-900 text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-3 shadow-lg"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>
      </form>

      <div className="p-6 bg-muted border border-border rounded-[6px] flex items-start gap-4">
        <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Note</p>
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            Changes apply to all hotels.
          </p>
        </div>
      </div>
    </div>
  );
}
