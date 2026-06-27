import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import KitchenDisplay from "@/components/dashboard/KitchenDisplay";

export default async function KitchenPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) redirect("/auth/login");

  return <KitchenDisplay hotelId={roleInfo.hotelId} />;
}
