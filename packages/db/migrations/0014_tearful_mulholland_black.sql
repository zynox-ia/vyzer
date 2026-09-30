CREATE TYPE "public"."sidebar_badge_style" AS ENUM('count', 'dot');--> statement-breakpoint
CREATE TYPE "public"."sidebar_item_key" AS ENUM('inbox', 'reviews', 'my-issues', 'agent', 'drafts', 'projects', 'views', 'members', 'teams');--> statement-breakpoint
CREATE TYPE "public"."sidebar_item_visibility" AS ENUM('always', 'when-badged', 'hidden');--> statement-breakpoint
CREATE TABLE "issue_draft" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"team_id" uuid,
	"title" text DEFAULT '' NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "member_sidebar_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"badge_style" "sidebar_badge_style" DEFAULT 'count' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sidebar_item_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"item_key" "sidebar_item_key" NOT NULL,
	"visibility" "sidebar_item_visibility" NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sidebar_item_preference_sort_order_check" CHECK ("sidebar_item_preference"."sort_order" >= 0)
);
--> statement-breakpoint
ALTER TABLE "issue_draft" ADD CONSTRAINT "issue_draft_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_draft" ADD CONSTRAINT "issue_draft_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_draft" ADD CONSTRAINT "issue_draft_creator_workspace_fk" FOREIGN KEY ("creator_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_sidebar_preference" ADD CONSTRAINT "member_sidebar_preference_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "member_sidebar_preference" ADD CONSTRAINT "member_sidebar_preference_member_workspace_fk" FOREIGN KEY ("member_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidebar_item_preference" ADD CONSTRAINT "sidebar_item_preference_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sidebar_item_preference" ADD CONSTRAINT "sidebar_item_preference_member_workspace_fk" FOREIGN KEY ("member_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_draft_creator_updated_index" ON "issue_draft" USING btree ("workspace_id","creator_id","updated_at","id");--> statement-breakpoint
CREATE UNIQUE INDEX "member_sidebar_preference_member_workspace_unique" ON "member_sidebar_preference" USING btree ("member_id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sidebar_item_preference_member_item_unique" ON "sidebar_item_preference" USING btree ("member_id","item_key");