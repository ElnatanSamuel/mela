const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  console.log('🚀 Updating system settings for single subscription model...');
  try {
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "subscription_price" numeric(12, 2) DEFAULT '499.00' NOT NULL`;
    await sql`ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "subscription_cycle" text DEFAULT 'monthly' NOT NULL`;
    
    console.log('🎉 Table updated successfully!');
  } catch (err) {
    console.error('❌ Update failed:', err);
  } finally {
    await sql.end();
  }
}

migrate();
