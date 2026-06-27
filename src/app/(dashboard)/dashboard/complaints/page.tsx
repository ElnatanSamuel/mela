import React from "react";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import ComplaintsContent from "@/components/dashboard/ComplaintsContent";

export default async function ComplaintsPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) redirect("/auth/login");

  return <ComplaintsContent hotelId={roleInfo.hotelId} />;
}
