import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import LoyaltyCustomers from "@/components/dashboard/LoyaltyCustomers";

export default async function LoyaltyPage() {
  const roleInfo = await getUserRole();

  if (!roleInfo) redirect("/auth/login");
  if (roleInfo.role === "waiter") redirect("/dashboard/orders");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-lg font-black text-foreground tracking-tighter uppercase">Loyalty</h2>
        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Your regulars</p>
      </div>
      <LoyaltyCustomers hotelId={roleInfo.hotelId || ""} />
    </div>
  );
}
