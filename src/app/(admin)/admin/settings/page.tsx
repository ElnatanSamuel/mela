import React from "react";
import { db } from "@/db";
import { hotels } from "@/db/schema";
import { Settings as SettingsIcon, Globe, Database, Shield } from "lucide-react";

export default async function PlatformSettingsPage() {
  const allHotels = await db.select().from(hotels);

  const settings = [
    {
      section: "Platform Info",
      icon: Globe,
      items: [
        { label: "Platform Name", value: "Mela" },
        { label: "Version", value: "1.0.0" },
        { label: "Environment", value: process.env.NODE_ENV || "development" },
      ],
    },
    {
      section: "Database",
      icon: Database,
      items: [
        { label: "Provider", value: "Supabase (PostgreSQL)" },
        { label: "Hotels Registered", value: String(allHotels.length) },
        {
          label: "Connection",
          value: process.env.DATABASE_URL ? "Connected" : "Not Set",
        },
      ],
    },
    {
      section: "Authentication",
      icon: Shield,
      items: [
        { label: "Provider", value: "Supabase Auth" },
        {
          label: "URL",
          value: process.env.NEXT_PUBLIC_SUPABASE_URL
            ? "Configured"
            : "Not Set",
        },
        { label: "Email Confirmation", value: "Auto-confirmed" },
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-2xl font-black text-neutral-900 tracking-tighter uppercase">
          Platform Settings
        </h2>
        <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest mt-1">
          System configuration and environment overview
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {settings.map((section) => (
          <div
            key={section.section}
            className="bg-white border border-neutral-200 rounded-[6px] p-6 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 rounded-[4px] bg-neutral-100">
                <section.icon className="w-4 h-4 text-neutral-900" />
              </div>
              <h3 className="text-[10px] font-black text-neutral-900 uppercase tracking-widest">
                {section.section}
              </h3>
            </div>
            <div className="space-y-4">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
                    {item.label}
                  </span>
                  <span className="text-xs font-bold text-neutral-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Registered Hotels */}
      <div className="bg-white border border-neutral-200 rounded-[6px] p-6 shadow-sm">
        <h3 className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-6">
          Registered Hotels
        </h3>
        <div className="space-y-3">
          {allHotels.map((hotel) => (
            <div
              key={hotel.id}
              className="flex items-center justify-between p-4 border border-neutral-100 rounded-[6px] hover:border-neutral-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-[6px] flex items-center justify-center font-black text-[10px] text-neutral-400">
                  {hotel.name
                    .split(" ")
                    .map((w) => w[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-sm font-bold text-neutral-900">
                    {hotel.name}
                  </p>
                  <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
                    /{hotel.slug}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-neutral-400">
                  {hotel.location || "No location set"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
