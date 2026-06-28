import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import OrdersContent from "@/components/dashboard/OrdersContent";

export default async function OrdersPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) redirect("/auth/login");

  return <OrdersContent hotelId={roleInfo.hotelId} role={roleInfo.role} />;
}
