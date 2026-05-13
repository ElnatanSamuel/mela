import { createClient } from '@supabase/supabase-js';
import { db } from './index';
import { hotelUsers, hotels } from './schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function seedNewAdmin() {
  const email = 'el@mela.com';
  const password = 'mela-admin-123';
  
  console.log(`🚀 Seeding New Platform Admin: ${email}...`);

  try {
    // 1. Try to create in Auth, ignore if exists
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    let userId = authUser.user?.id;

    if (authError) {
      console.log(`ℹ️ Auth check: ${authError.message}`);
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
      userId = existing.users.find(u => u.email === email)?.id;
    }

    if (!userId) throw new Error("Could not determine User ID");

    // 2. Find a hotel for fallback
    const [hotel] = await db.select().from(hotels).limit(1);

    // 3. Link in DB
    try {
      console.log(`Attempting Global Link for ${userId}...`);
      await db.insert(hotelUsers).values({
        userId,
        role: 'platform_admin',
        hotelId: null 
      });
      console.log(`✅ Successfully linked ${email} as Global Platform Admin`);
    } catch (err: any) {
      console.log(`⚠️ Global Link failed: ${err.message}. Trying fallback...`);
      if (hotel) {
         try {
           await db.insert(hotelUsers).values({
             userId,
             role: 'platform_admin',
             hotelId: hotel.id
           });
           console.log(`✅ Successfully linked ${email} as Platform Admin (via ${hotel.name})`);
         } catch (innerErr: any) {
           console.log(`ℹ️ Fallback also failed (likely already exists): ${innerErr.message}`);
         }
      } else {
        console.error("❌ No hotels found to link to!");
      }
    }

    console.log(`\n✨ DONE! Login with ${email} / ${password}`);

  } catch (err) {
    console.error('❌ Seeding failed:', err);
  }
}

seedNewAdmin();
