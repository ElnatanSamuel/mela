"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hotelUsers, hotels } from "@/db/schema";
import { getSession } from "./auth-utils";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

export async function signOut() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  await supabase.auth.signOut();
  redirect("/auth/login");
}

export async function fixMyAdmin() {
  const { data: { user } } = await getSession();
  
  if (!user) {
    throw new Error("No active session found. Please login first.");
  }

  try {
    await db.insert(hotelUsers).values({
      userId: user.id,
      role: 'platform_admin',
      hotelId: null
    });
  } catch (err: any) {
    if (err.message?.includes('not-null constraint')) {
       const [hotel] = await db.select().from(hotels).limit(1);
       if (hotel) {
         await db.insert(hotelUsers).values({
           userId: user.id,
           role: 'platform_admin',
           hotelId: hotel.id
         });
       }
    }
  }

  redirect("/admin");
}

export async function createHotel(formData: FormData) {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const location = formData.get('location') as string;
    const phone = formData.get('phone') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const bannerUrl = formData.get('bannerUrl') as string;
    const vatNumber = formData.get('vatNumber') as string;
    const vatRate = parseFloat(formData.get('vatRate') as string || "0.15");
    const serviceChargeRate = parseFloat(formData.get('serviceChargeRate') as string || "0.10");

    if (!name || !slug) throw new Error("Name and Slug are required");

    await db.insert(hotels).values({
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        location,
        phone,
        logoUrl,
        bannerUrl,
        vatNumber,
        settings: { vatRate, serviceChargeRate }
    });

    revalidatePath('/admin/hotels');
    revalidatePath('/admin');
    return { success: true };
}

export async function updateHotel(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const phone = formData.get('phone') as string;
    const logoUrl = formData.get('logoUrl') as string;
    const bannerUrl = formData.get('bannerUrl') as string;
    const vatNumber = formData.get('vatNumber') as string;
    const vatRate = parseFloat(formData.get('vatRate') as string || "0.15");
    const serviceChargeRate = parseFloat(formData.get('serviceChargeRate') as string || "0.10");

    if (!name) throw new Error("Name is required");

    await db.update(hotels)
        .set({
            name,
            location,
            phone,
            logoUrl,
            bannerUrl,
            vatNumber,
            settings: { vatRate, serviceChargeRate },
            updatedAt: new Date(),
        })
        .where(eq(hotels.id, id));

    revalidatePath('/admin/hotels');
    revalidatePath('/admin');
    return { success: true };
}

export async function deleteHotel(id: string) {
    await db.delete(hotels).where(eq(hotels.id, id));
    revalidatePath('/admin/hotels');
    revalidatePath('/admin');
    return { success: true };
}
