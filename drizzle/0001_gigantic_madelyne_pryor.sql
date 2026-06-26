CREATE TABLE "subscription_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"billing_cycle" text DEFAULT 'monthly' NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "menu_items" DROP CONSTRAINT "menu_items_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "hotel_users" ALTER COLUMN "hotel_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "subscription_plan" text DEFAULT 'Standard' NOT NULL;--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "subscription_plan_id" uuid;--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_subscription_plan_id_subscription_plans_id_fk" FOREIGN KEY ("subscription_plan_id") REFERENCES "public"."subscription_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;