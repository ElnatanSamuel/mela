import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import StaffContent from "@/components/dashboard/StaffContent";

export default async function StaffPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) redirect("/auth/login");

  return <StaffContent hotelId={roleInfo.hotelId} role={roleInfo.role} />;
}
