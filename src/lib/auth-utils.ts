import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { db } from "@/db";
import { hotelUsers, hotels } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function getSession() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  return supabase.auth.getUser();
}

export async function getUserRole() {
  const session = await getSession();
  const user = session?.data?.user;

  if (!user) {
    console.log("⚠️ [getUserRole] No session user found");
    return null;
  }

  try {
    const results = await db
      .select({
        role: hotelUsers.role,
        hotelId: hotelUsers.hotelId,
        hotelName: hotels.name,
      })
      .from(hotelUsers)
      .leftJoin(hotels, eq(hotels.id, hotelUsers.hotelId))
      .where(eq(hotelUsers.userId, user.id))
      .orderBy(sql`CASE WHEN ${hotelUsers.role} = 'platform_admin' THEN 0 
                        WHEN ${hotelUsers.role} = 'owner' THEN 1 
                        WHEN ${hotelUsers.role} = 'manager' THEN 2 
                        ELSE 3 END`);

    console.log(`🔍 [getUserRole] Query results for ${user.email}:`, results);

    if (!results || results.length === 0) {
      console.log(`❌ [getUserRole] No role entry found for user ${user.id} (${user.email})`);
      return null;
    }

    return results[0];
  } catch (error) {
    console.error("❌ [getUserRole] DB query failed:", error);
    return null;
  }
}

export async function isHotelAdmin() {
  const roleInfo = await getUserRole();
  return roleInfo?.role === 'owner' || roleInfo?.role === 'manager';
}
