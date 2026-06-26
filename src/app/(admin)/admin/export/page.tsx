import React from "react";
export const dynamic = 'force-dynamic';

import { db } from "@/db";
import { hotels } from "@/db/schema";
import { getUserRole } from "@/lib/auth-utils";
import ExportClient from "./ExportClient";

export default async function ExportPage() {
  const roleInfo = await getUserRole();
  const isPlatformAdmin = roleInfo?.role === "platform_admin";

  let allHotels: { id: string; name: string }[] = [];
  if (isPlatformAdmin) {
    allHotels = await db.select({ id: hotels.id, name: hotels.name }).from(hotels).orderBy(hotels.name);
  }

  return <ExportClient isPlatformAdmin={isPlatformAdmin} allHotels={allHotels} defaultHotelId={roleInfo?.hotelId || ""} />;
}
