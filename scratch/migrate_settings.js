const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  console.log('🚀 Running system settings migration...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "system_settings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "platform_name" text DEFAULT 'Mela' NOT NULL,
        "support_email" text DEFAULT 'support@mela.et',
        "maintenance_mode" boolean DEFAULT false NOT NULL,
        "global_vat_rate" numeric(5, 2) DEFAULT '0.15' NOT NULL,
        "global_service_charge" numeric(5, 2) DEFAULT '0.10' NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    
    // Insert default settings if not exists
    const existing = await sql`SELECT count(*) FROM system_settings`;
    if (Number(existing[0].count) === 0) {
      await sql`INSERT INTO system_settings (platform_name) VALUES ('Mela')`;
      console.log('✅ Default system settings initialized');
    }
    
    console.log('🎉 Migration finished successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sql.end();
  }
}

migrate();
