import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/auth-utils";
import PromoCodeManager from "@/components/dashboard/PromoCodeManager";

export default async function PromosPage() {
  const roleInfo = await getUserRole();
  if (!roleInfo || !roleInfo.hotelId) redirect("/auth/login");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground tracking-tighter uppercase">
          Promo Codes
        </h2>
        <p className="text-sm text-muted-foreground mt-1 font-medium">
          Create and manage discount codes.
        </p>
      </div>
      <PromoCodeManager />
    </div>
  );
}
