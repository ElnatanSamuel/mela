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

async function createAccounts() {
  console.log('🚀 Starting Super-Account Creation...');

  const testAccounts = [
    { email: 'admin@mela.com', password: 'mela-admin-123', role: 'platform_admin' as const },
    { email: 'manager@hotel.com', password: 'hotel-manager-123', role: 'owner' as const },
    { email: 'staff@hotel.com', password: 'hotel-staff-123', role: 'waiter' as const },
  ];

  try {
    // Get the demo hotel
    const [hotel] = await db.select().from(hotels).where(eq(hotels.slug, 'habesha-palace')).limit(1);
    
    if (!hotel) {
      console.error('❌ Demo hotel not found. Run npm run db:seed first!');
      return;
    }

    for (const acc of testAccounts) {
      console.log(`\nCreating ${acc.role}: ${acc.email}...`);

      // 1. Create User in Supabase Auth (Bypassing Email Confirmation)
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`ℹ️ User ${acc.email} already exists in Auth. Skipping auth creation...`);
          // We would still try to link them in the next step
        } else {
          console.error(`❌ Error creating auth user ${acc.email}:`, authError.message);
          continue;
        }
      }

      const userId = authUser.user?.id;
      if (!userId) {
        // If user existed, we need to fetch their ID
        const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
        const found = existingUser.users.find(u => u.email === acc.email);
        if (found) {
          // Continue to link
          await linkUser(found.id, acc.role, hotel.id);
        }
        continue;
      }

      await linkUser(userId, acc.role, hotel.id);
    }

    console.log('\n✨ ALL ACCOUNTS CREATED & LINKED! ✨');
    console.log('------------------------------------');
    console.log('SYSTEM ADMIN: admin@mela.com / mela-admin-123');
    console.log('MANAGER:      manager@hotel.com / hotel-manager-123');
    console.log('STAFF:        staff@hotel.com / hotel-staff-123');
    console.log('------------------------------------\n');

  } catch (err) {
    console.error('❌ Critical Error:', err);
  }
}

async function linkUser(userId: string, role: any, hotelId: string) {
  try {
    // 2. Link in our Database
    await db.insert(hotelUsers).values({
      userId,
      hotelId: role === 'platform_admin' ? null : hotelId,
      role
    });
    console.log(`✅ Successfully linked ${role} in DB`);
  } catch (err) {
    console.log(`ℹ️ Role link already exists for this user in DB.`);
  }
}

createAccounts();
