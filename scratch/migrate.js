const postgres = require('postgres');
require('dotenv').config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function migrate() {
  console.log('🚀 Running manual migration...');
  try {
    // 1. Create subscription_plans table if not exists
    await sql`
      CREATE TABLE IF NOT EXISTS "subscription_plans" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "name" text NOT NULL,
        "price" numeric(12, 2) NOT NULL,
        "billing_cycle" text DEFAULT 'monthly' NOT NULL,
        "features" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "description" text,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `;
    console.log('✅ subscription_plans table checked/created');

    // 2. Add columns to hotels table
    // We use try-catch for each column because they might already exist
    try {
      await sql`ALTER TABLE "hotels" ADD COLUMN "subscription_plan" text DEFAULT 'Standard' NOT NULL`;
      console.log('✅ added subscription_plan column');
    } catch (e) {}

    try {
      await sql`ALTER TABLE "hotels" ADD COLUMN "subscription_plan_id" uuid`;
      console.log('✅ added subscription_plan_id column');
    } catch (e) {}

    try {
      await sql`ALTER TABLE "hotels" ADD COLUMN "subscription_expires_at" timestamp`;
      console.log('✅ added subscription_expires_at column');
    } catch (e) {}

    try {
      await sql`ALTER TABLE "hotels" ADD CONSTRAINT "hotels_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action`;
      console.log('✅ added foreign key constraint');
    } catch (e) {}

    console.log('🎉 Migration finished successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await sql.end();
  }
}

migrate();
