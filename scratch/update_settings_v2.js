const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  console.log('🚀 Updating system settings table...');
  try {
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "support_phone" text DEFAULT '+251 900 000 000'`;
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "currency" text DEFAULT 'ETB' NOT NULL`;
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "trial_days" integer DEFAULT 14 NOT NULL`;
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "allow_self_onboarding" boolean DEFAULT true NOT NULL`;
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "logo_url" text`;
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "banner_url" text`;
    
    console.log('🎉 Table updated successfully!');
  } catch (err) {
    console.error('❌ Update failed:', err);
  } finally {
    await sql.end();
  }
}

migrate();
