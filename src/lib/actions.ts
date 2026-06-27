"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hotelUsers, hotels, auditLogs, systemSettings } from "@/db/schema";
import { getSession } from "./auth-utils";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { supabaseAdmin } from "./supabase-admin";

// --- Audit Logging Helper ---
async function logAction(
    hotelId: string, 
    userId: string | null, 
    action: string, 
    entityType: string, 
    entityId: string, 
    oldData: any = null, 
    newData: any = null
) {
    try {
        await db.insert(auditLogs).values({
            hotelId,
            userId,
            action,
            entityType,
            entityId,
            oldData,
            newData
        });
    } catch (e) {
        console.error("Audit Logging Failed:", e);
    }
}

// --- Storage Utilities ---
async function uploadToStorage(file: File, path: string) {
    if (!file || file.size === 0) return null;
    
    // Ensure bucket exists (platform admin power)
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    if (!buckets?.find(b => b.name === 'hotel-assets')) {
        await supabaseAdmin.storage.createBucket('hotel-assets', { public: true });
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${path}/${fileName}`;

    const { error: uploadError } = await supabaseAdmin.storage
        .from('hotel-assets')
        .upload(filePath, file);

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    const { data: { publicUrl } } = supabaseAdmin.storage
        .from('hotel-assets')
        .getPublicUrl(filePath);

    return publicUrl;
}

// --- Auth Actions ---
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
  const session = await getSession();
  const user = session?.data?.user;
  if (!user) throw new Error("No authenticated user found");

  const existing = await db
    .select()
    .from(hotelUsers)
    .where(eq(hotelUsers.userId, user.id))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(hotelUsers)
      .set({ role: "platform_admin" })
      .where(eq(hotelUsers.userId, user.id));
  } else {
    await db.insert(hotelUsers).values({
      userId: user.id,
      role: "platform_admin",
      hotelId: null,
    });
  }

  revalidatePath("/auth/diagnostic");
  redirect("/admin");
}

// --- Hotel Actions ---
export async function createHotel(formData: FormData) {
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const location = formData.get('location') as string;
    const phone = formData.get('phone') as string;
    const vatNumber = formData.get('vatNumber') as string;
    const vatRate = parseFloat(formData.get('vatRate') as string || "0.15");
    const serviceChargeRate = parseFloat(formData.get('serviceChargeRate') as string || "0.10");

    // Files
    const logoFile = formData.get('logoFile') as File;
    const bannerFile = formData.get('bannerFile') as File;

    // Admin Credentials
    const adminEmail = formData.get('adminEmail') as string;
    const adminPassword = formData.get('adminPassword') as string;

    if (!name || !slug) throw new Error("Name and Slug are required");
    if (!adminEmail || !adminPassword) throw new Error("Owner credentials (email/password) are required");

    // 1. Upload Assets
    const logoUrl = await uploadToStorage(logoFile, 'logos');
    const bannerUrl = await uploadToStorage(bannerFile, 'banners');

    // 2. Create the Hotel
    const [newHotel] = await db.insert(hotels).values({
        name,
        slug: slug.toLowerCase().trim().replace(/\s+/g, '-'),
        location,
        phone,
        logoUrl,
        bannerUrl,
        vatNumber,
        subscriptionPlan: formData.get('subscriptionPlan') as string || 'Standard',
        subscriptionPlanId: formData.get('subscriptionPlanId') as string || null,
        subscriptionExpiresAt: formData.get('subscriptionExpiresAt') ? new Date(formData.get('subscriptionExpiresAt') as string) : null,
        settings: { vatRate, serviceChargeRate }
    }).returning();

    // Log the action
    await logAction(
        newHotel.id,
        null, // Could be current admin session
        'ONBOARD_HOTEL',
        'hotel',
        newHotel.id,
        null,
        newHotel
    );

    // 3. Create the Owner
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { hotelId: newHotel.id, role: 'owner' }
    });

    if (authError) throw new Error(`Auth creation failed: ${authError.message}`);

    await db.insert(hotelUsers).values({
        userId: authData.user.id,
        hotelId: newHotel.id,
        role: 'owner'
    });

    revalidatePath('/admin/hotels');
    revalidatePath('/admin');
    return;
}

export async function updateHotel(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const location = formData.get('location') as string;
    const phone = formData.get('phone') as string;
    const vatNumber = formData.get('vatNumber') as string;
    const vatRate = parseFloat(formData.get('vatRate') as string || "0.15");
    const serviceChargeRate = parseFloat(formData.get('serviceChargeRate') as string || "0.10");

    const logoFile = formData.get('logoFile') as File;
    const bannerFile = formData.get('bannerFile') as File;
    const logoUrlInput = formData.get('logoUrlInput') as string;
    const bannerUrlInput = formData.get('bannerUrlInput') as string;

    if (!name) throw new Error("Name is required");

    // 1. Resolve Logo (URL input has priority if changed, otherwise File, otherwise keep old)
    let finalLogoUrl = logoUrlInput || null;
    if (logoFile && logoFile.size > 0) {
        finalLogoUrl = await uploadToStorage(logoFile, 'logos');
    }

    // 2. Resolve Banner
    let finalBannerUrl = bannerUrlInput || null;
    if (bannerFile && bannerFile.size > 0) {
        finalBannerUrl = await uploadToStorage(bannerFile, 'banners');
    }

    const planId = formData.get('subscriptionPlanId') as string;
    const expiresAt = formData.get('subscriptionExpiresAt') as string;

    const updateData: any = {
        name,
        location,
        phone,
        vatNumber,
        subscriptionPlan: (formData.get('subscriptionPlan') as string) || 'Standard',
        subscriptionPlanId: planId && planId.trim() !== "" ? planId : null,
        subscriptionExpiresAt: expiresAt && expiresAt.trim() !== "" ? new Date(expiresAt) : null,
        settings: { vatRate, serviceChargeRate },
        updatedAt: new Date(),
    };

    if (finalLogoUrl) updateData.logoUrl = finalLogoUrl;
    if (finalBannerUrl) updateData.bannerUrl = finalBannerUrl;

    const [updatedHotel] = await db.update(hotels)
        .set(updateData)
        .where(eq(hotels.id, id))
        .returning();

    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));

    // Log the action
    await logAction(
        id,
        null,
        'UPDATE_HOTEL_CONFIG',
        'hotel',
        id,
        hotel,
        updatedHotel
    );

    revalidatePath('/admin/hotels');
    revalidatePath(`/admin/hotels/${id}`);
    revalidatePath('/admin');
    return;
}

export async function deleteHotel(id: string) {
    await db.delete(hotels).where(eq(hotels.id, id));

    await logAction(id, null, 'DECOMMISSION_HOTEL', 'hotel', id, null, null);

    revalidatePath('/admin/hotels');
    revalidatePath('/admin');
    return;
}

// --- User/Staff Actions ---
export async function deleteUser(id: string, userId: string, hotelId?: string) {
    await db.delete(hotelUsers).where(eq(hotelUsers.id, id));
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) console.error("⚠️ Failed to delete user from Supabase:", error.message);
    
    revalidatePath('/admin/users');
    if (hotelId) revalidatePath(`/admin/hotels/${hotelId}`);
    revalidatePath('/admin');
    return;
}

export async function createStaff(formData: FormData) {
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as any; 
    const hotelId = formData.get('hotelId') as string || null;

    if (!email || !role) throw new Error("Email and Role are required");

    // 1. Generate Secure Random Password
    const tempPassword = Math.random().toString(36).slice(-10) + "!";

    // 2. Create in Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { hotelId, role }
    });

    if (authError) throw new Error(`Staff creation failed: ${authError.message}`);

    const [newStaff] = await db.insert(hotelUsers).values({
        userId: authData.user!.id,
        hotelId: hotelId || null,
        name: name || email.split("@")[0],
        role
    }).returning();

    // 3. Dispatch Email (Mock for now, plug in Resend/SendGrid key in env)
    console.log(`
        -------------------------------------------
        MAIL DISPATCH: Staff Credentials
        TO: ${email}
        PASSWORD: ${tempPassword}
        ROLE: ${role}
        -------------------------------------------
    `);

    await logAction(hotelId!, null, 'CREATE_STAFF', 'user', authData.user!.id, null, newStaff);

    revalidatePath('/admin/hotels/[id]', 'page');
    revalidatePath('/admin');
    return;
}

// --- Subscription Actions ---
export async function createSubscriptionPlan(formData: FormData) {
    const { subscriptionPlans } = require('@/db/schema');
    
    const [newPlan] = await db.insert(subscriptionPlans).values({
        name: formData.get('name') as string,
        price: formData.get('price') as string,
        billingCycle: formData.get('billingCycle') as any,
        description: formData.get('description') as string,
        features: JSON.parse(formData.get('features') as string || '[]'),
    }).returning();

    await logAction('PLATFORM', null, 'CREATE_PLAN', 'subscription_plan', newPlan.id, null, newPlan);

    revalidatePath('/admin/subscriptions');
    return;
}

export async function updateSubscriptionPlan(id: string, formData: FormData) {
    const name = formData.get('name') as string;
    const price = formData.get('price') as string;
    const billingCycle = formData.get('billingCycle') as any;
    const description = formData.get('description') as string;
    const features = JSON.parse(formData.get('features') as string || '[]');

    const { subscriptionPlans } = require('@/db/schema');
    await db.update(subscriptionPlans)
        .set({ name, price, billingCycle, description, features, updatedAt: new Date() })
        .where(eq(subscriptionPlans.id, id));

    revalidatePath('/admin/subscriptions');
    return;
}

export async function manageHotelSubscription(hotelId: string, action: 'restart' | 'terminate' | 'update_plan', data?: any) {
    const updateData: any = { updatedAt: new Date() };

    if (action === 'terminate') {
        await db.update(hotels).set({ 
            subscriptionExpiresAt: new Date() 
        }).where(eq(hotels.id, hotelId));
        await logAction(hotelId, null, 'TERMINATE_SUBSCRIPTION', 'hotel', hotelId, null, null);
    } else if (action === 'restart') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await db.update(hotels).set({ 
            subscriptionExpiresAt: expiresAt,
            subscriptionPlan: 'Standard' 
        }).where(eq(hotels.id, hotelId));

        await logAction(hotelId, null, 'RESTART_SUBSCRIPTION', 'hotel', hotelId, null, { expiresAt });
    } else if (action === 'update_plan') {
        updateData.subscriptionPlanId = data.planId;
        updateData.subscriptionPlan = data.planName;
        if (data.expiresAt) updateData.subscriptionExpiresAt = new Date(data.expiresAt);
        
        await db.update(hotels)
            .set(updateData)
            .where(eq(hotels.id, hotelId));
    }

    revalidatePath('/admin/subscriptions');
    revalidatePath(`/admin/hotels/${hotelId}`);
    return;
}

export async function updateSystemSettings(formData: FormData) {
    const { systemSettings } = require('@/db/schema');
    
    const [oldSettings] = await db.select().from(systemSettings).limit(1);
    
    const updateData = {
        platformName: formData.get('platformName') as string,
        supportEmail: formData.get('supportEmail') as string,
        supportPhone: formData.get('supportPhone') as string,
        currency: formData.get('currency') as string,
        trialDays: parseInt(formData.get('trialDays') as string) || 14,
        maintenanceMode: formData.get('maintenanceMode') === 'on',
        allowSelfOnboarding: formData.get('allowSelfOnboarding') === 'on',
        subscriptionPrice: formData.get('subscriptionPrice') as string,
        subscriptionCycle: formData.get('subscriptionCycle') as string,
        globalVatRate: formData.get('globalVatRate') as string,
        globalServiceCharge: formData.get('globalServiceCharge') as string,
        logoUrl: formData.get('logoUrl') as string,
        bannerUrl: formData.get('bannerUrl') as string,
        updatedAt: new Date(),
    };

    const [newSettings] = await db.update(systemSettings)
        .set(updateData)
        .where(eq(systemSettings.id, oldSettings.id))
        .returning();

    await logAction('PLATFORM', null, 'SAVE_SYSTEM_SETTINGS', 'system_settings', newSettings.id, oldSettings, newSettings);

    revalidatePath('/admin/settings');
    return;
}

export async function sendBroadcast(formData: FormData) {
    const { broadcastNotifications } = require('@/db/schema');
    
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;
    const type = formData.get('type') as 'info' | 'alert' | 'maintenance';
    const expiresAt = formData.get('expiresAt') ? new Date(formData.get('expiresAt') as string) : null;

    const [newBroadcast] = await db.insert(broadcastNotifications).values({
        title,
        message,
        type,
        expiresAt,
        isActive: true,
    }).returning();

    await logAction('PLATFORM', null, 'SEND_BROADCAST', 'broadcast_notifications', newBroadcast.id, null, newBroadcast);

    revalidatePath('/admin/notifications');
    return;
}

export async function toggleBroadcast(id: string, isActive: boolean) {
    const { broadcastNotifications } = require('@/db/schema');
    
    const [updated] = await db.update(broadcastNotifications)
        .set({ isActive, updatedAt: new Date() })
        .where(eq(broadcastNotifications.id, id))
        .returning();

    await logAction('PLATFORM', null, 'TOGGLE_BROADCAST', 'broadcast_notifications', id, { isActive: !isActive }, { isActive });

    revalidatePath('/admin/notifications');
    return;
}

export async function signUpUser(email: string, password: string, fullName: string) {
    const settings = await db.select().from(systemSettings).limit(1);
    if (settings.length > 0 && !settings[0].allowSelfOnboarding) {
        throw new Error("Self-onboarding is currently disabled");
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
    });

    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Failed to create user");

    return { userId: data.user.id };
}
