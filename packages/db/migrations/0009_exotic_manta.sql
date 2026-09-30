CREATE TABLE "customer_domain_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_domain_rule_kind_check" CHECK ("customer_domain_rule"."kind" in ('excluded', 'generic')),
	CONSTRAINT "customer_domain_rule_value_normalized" CHECK ("customer_domain_rule"."value" = lower("customer_domain_rule"."value") and length(trim("customer_domain_rule"."value")) > 0)
);
--> statement-breakpoint
CREATE TABLE "customer_settings" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"default_team_id" uuid,
	"revenue_period" text DEFAULT 'annual' NOT NULL,
	"revenue_currency" text DEFAULT 'USD' NOT NULL,
	"attributes_data_source" text,
	"manual_edits_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_settings_revenue_period_check" CHECK ("customer_settings"."revenue_period" in ('annual', 'monthly')),
	CONSTRAINT "customer_settings_revenue_currency_check" CHECK ("customer_settings"."revenue_currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "customer_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_status_name_not_empty" CHECK (length(trim("customer_status"."name")) > 0),
	CONSTRAINT "customer_status_position_nonnegative" CHECK ("customer_status"."position" >= 0)
);
--> statement-breakpoint
CREATE TABLE "customer_tier" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "customer_tier_name_not_empty" CHECK (length(trim("customer_tier"."name")) > 0),
	CONSTRAINT "customer_tier_position_nonnegative" CHECK ("customer_tier"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "customer_domain_rule" ADD CONSTRAINT "customer_domain_rule_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_settings" ADD CONSTRAINT "customer_settings_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_settings" ADD CONSTRAINT "customer_settings_default_team_id_team_id_fk" FOREIGN KEY ("default_team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_status" ADD CONSTRAINT "customer_status_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_tier" ADD CONSTRAINT "customer_tier_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "customer_domain_rule_workspace_kind_value_unique" ON "customer_domain_rule" USING btree ("workspace_id","kind","value");--> statement-breakpoint
CREATE UNIQUE INDEX "customer_status_workspace_name_unique" ON "customer_status" USING btree ("workspace_id",lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX "customer_tier_workspace_name_unique" ON "customer_tier" USING btree ("workspace_id",lower("name"));