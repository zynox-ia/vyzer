CREATE TYPE "public"."notification_email_format" AS ENUM('digest', 'immediate');--> statement-breakpoint
CREATE TYPE "public"."notification_preference_channel" AS ENUM('priority', 'desktop', 'mobile', 'email', 'slack');--> statement-breakpoint
CREATE TYPE "public"."notification_preference_type" AS ENUM('assignments', 'status-changes', 'comments-and-replies', 'mentions', 'reactions', 'subscriptions', 'document-changes', 'updates', 'reminders-and-deadlines', 'loops', 'apps-and-integrations', 'billing', 'reviews', 'triage');--> statement-breakpoint
CREATE TABLE "notification_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"priority_inbox_enabled" boolean DEFAULT false NOT NULL,
	"email_enabled" boolean DEFAULT true NOT NULL,
	"email_format" "notification_email_format" DEFAULT 'digest' NOT NULL,
	"email_digest_delay_low_priority" boolean DEFAULT true NOT NULL,
	"email_digest_urgent_immediate" boolean DEFAULT true NOT NULL,
	"show_changelog_in_sidebar" boolean DEFAULT true NOT NULL,
	"changelog_newsletter" boolean DEFAULT false NOT NULL,
	"marketing_and_onboarding" boolean DEFAULT true NOT NULL,
	"invite_accepted" boolean DEFAULT true NOT NULL,
	"privacy_and_legal_updates" boolean DEFAULT true NOT NULL,
	"data_processing_agreement" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_type_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"channel" "notification_preference_channel" NOT NULL,
	"type" "notification_preference_type" NOT NULL,
	"enabled" boolean NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "notification_preference_member_unique" ON "notification_preference" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_type_preference_member_channel_type_unique" ON "notification_type_preference" USING btree ("member_id","channel","type");--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_preference" ADD CONSTRAINT "notification_preference_member_workspace_fk" FOREIGN KEY ("member_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_type_preference" ADD CONSTRAINT "notification_type_preference_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_type_preference" ADD CONSTRAINT "notification_type_preference_member_workspace_fk" FOREIGN KEY ("member_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
