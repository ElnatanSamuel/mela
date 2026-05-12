import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { db } from "@/db";
import { hotelUsers, hotels } from "@/db/schema";
import { eq, and } from "drizzle-orm";

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
  const { data: { user } } = await getSession();
  
  if (!user) return null;

  const [roleInfo] = await db
    .select({
      role: hotelUsers.role,
      hotelId: hotelUsers.hotelId,
      hotelName: hotels.name,
    })
    .from(hotelUsers)
    .innerJoin(hotels, eq(hotels.id, hotelUsers.hotelId))
    .where(eq(hotelUsers.userId, user.id))
    .limit(1);

  return roleInfo || null;
}

export async function isHotelAdmin() {
  const roleInfo = await getUserRole();
  return roleInfo?.role === 'owner' || roleInfo?.role === 'manager';
}
