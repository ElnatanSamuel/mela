const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  console.log('🚀 Creating broadcast_notifications table...');
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "broadcast_notifications" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" text NOT NULL,
        "message" text NOT NULL,
        "type" text DEFAULT 'info' NOT NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "expires_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "created_by" uuid
      )
    `;
    console.log('🎉 Table created successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sql.end();
  }
}

migrate();
