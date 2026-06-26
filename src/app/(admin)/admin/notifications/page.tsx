import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { broadcastNotifications } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  Bell,
  Send,
  ShieldAlert,
  Info,
  ToggleLeft,
  ToggleRight,
  Clock,
  Calendar,
} from "lucide-react";
import { sendBroadcast, toggleBroadcast } from "@/lib/actions";
import { formatDistanceToNow } from "date-fns";

export default async function NotificationCenterPage() {
  const broadcasts = await db
    .select()
    .from(broadcastNotifications)
    .orderBy(desc(broadcastNotifications.createdAt));

  return (
    <div className="max-w-6xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
            Notifications
          </h2>
          <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] mt-1">
            Send and manage announcements
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5 space-y-8">
          <div className="bg-card border border-border rounded-[6px] p-8 shadow-sm space-y-8 relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-2">
              <Send className="w-4 h-4 text-foreground" />
              <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
                New Announcement
              </h3>
            </div>

            <form action={sendBroadcast} className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Title
                </label>
                <input
                  name="title"
                  required
                  placeholder="e.g. System Maintenance"
                  className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground bg-card text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={4}
                  placeholder="Tell the hotels what's happening..."
                  className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Type
                  </label>
                  <select
                    name="type"
                    className="w-full p-4 border border-border rounded-[4px] text-xs font-bold uppercase tracking-widest focus:outline-none focus:border-foreground bg-card text-foreground"
                  >
                    <option value="info">Information</option>
                    <option value="alert">Critical Alert</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Expires (optional)
                  </label>
                  <input
                    name="expiresAt"
                    type="datetime-local"
                    className="w-full p-4 border border-border rounded-[4px] text-xs font-bold focus:outline-none focus:border-foreground bg-card text-foreground"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-5 bg-neutral-900 text-white rounded-[6px] text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg"
              >
                <Bell className="w-4 h-4" />
                Send Announcement
              </button>
            </form>
          </div>

          <div className="p-6 bg-muted border border-border rounded-[6px] flex items-start gap-4">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-[10px] font-black text-foreground uppercase tracking-widest">
                Note
              </p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Announcements show up on all hotel dashboards right away.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xs font-black text-foreground uppercase tracking-widest">
              History
            </h3>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
              {broadcasts.length} Total
            </span>
          </div>

          <div className="space-y-4">
            {broadcasts.map((b) => (
              <div
                key={b.id}
                className={`bg-card border rounded-[6px] p-6 shadow-sm flex items-start justify-between gap-6 transition-all group relative overflow-hidden ${
                  !b.isActive
                    ? "opacity-60 grayscale border-border"
                    : "border-border hover:border-foreground/20"
                }`}
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    b.type === "alert"
                      ? "bg-destructive"
                      : b.type === "maintenance"
                        ? "bg-muted-foreground"
                        : "bg-primary"
                  }`}
                />

                <div className="flex gap-6 items-start">
                  <div
                    className={`p-3 rounded-[6px] ${
                      b.type === "alert"
                        ? "bg-destructive/10"
                        : b.type === "maintenance"
                          ? "bg-muted"
                          : "bg-primary/10"
                    }`}
                  >
                    {b.type === "alert" ? (
                      <ShieldAlert className="w-5 h-5 text-destructive" />
                    ) : b.type === "maintenance" ? (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <Info className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-sm font-black text-foreground uppercase tracking-tight">
                        {b.title}
                      </h4>
                      {b.isActive && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-md">
                      {b.message}
                    </p>
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-muted-foreground/60" />
                        <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                          {formatDistanceToNow(new Date(b.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      {b.expiresAt && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-muted-foreground/60" />
                          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">
                            Expires {new Date(b.expiresAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await toggleBroadcast(b.id, !b.isActive);
                    }}
                  >
                    <button
                      type="submit"
                      className={`p-2 rounded-[6px] transition-all ${
                        b.isActive
                          ? "text-foreground hover:bg-muted"
                          : "text-muted-foreground/60 hover:text-foreground"
                      }`}
                    >
                      {b.isActive ? (
                        <ToggleRight className="w-6 h-6" />
                      ) : (
                        <ToggleLeft className="w-6 h-6" />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            ))}

            {broadcasts.length === 0 && (
              <div className="p-20 bg-muted border border-dashed border-border rounded-[6px] flex flex-col items-center justify-center text-center">
                <Bell className="w-12 h-12 text-muted-foreground/30 mb-4" />
                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">
                  No Active Announcements
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
