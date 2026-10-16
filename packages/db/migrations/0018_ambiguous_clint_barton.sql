CREATE TYPE "public"."github_checks_status" AS ENUM('pending', 'success', 'failure');--> statement-breakpoint
CREATE TYPE "public"."github_installation_status" AS ENUM('active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."github_merge_strategy" AS ENUM('merge', 'squash', 'rebase');--> statement-breakpoint
CREATE TYPE "public"."github_pull_request_state" AS ENUM('draft', 'open', 'merged', 'closed');--> statement-breakpoint
CREATE TYPE "public"."github_review_decision" AS ENUM('approved', 'changes_requested', 'review_required');--> statement-breakpoint
CREATE TABLE "code_review_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"auto_convert_draft_pull_requests" boolean DEFAULT false NOT NULL,
	"merge_strategy" "github_merge_strategy" DEFAULT 'merge' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"github_user_id" text NOT NULL,
	"github_login" text NOT NULL,
	"github_avatar_url" text,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "github_installation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"installation_id" text NOT NULL,
	"account_id" text NOT NULL,
	"account_login" text NOT NULL,
	"account_type" text NOT NULL,
	"installed_by_member_id" uuid,
	"status" "github_installation_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pull_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"installation_id" uuid NOT NULL,
	"issue_id" uuid,
	"repo_full_name" text NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"author_github_login" text NOT NULL,
	"url" text NOT NULL,
	"state" "github_pull_request_state" NOT NULL,
	"head_branch" text NOT NULL,
	"checks_status" "github_checks_status",
	"review_decision" "github_review_decision",
	"github_updated_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pull_request_number_check" CHECK ("pull_request"."number" > 0)
);
--> statement-breakpoint
ALTER TABLE "code_review_settings" ADD CONSTRAINT "code_review_settings_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_connection" ADD CONSTRAINT "github_connection_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_connection" ADD CONSTRAINT "github_connection_member_workspace_fk" FOREIGN KEY ("member_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "github_installation" ADD CONSTRAINT "github_installation_installed_by_member_id_member_id_fk" FOREIGN KEY ("installed_by_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_installation_id_github_installation_id_fk" FOREIGN KEY ("installation_id") REFERENCES "public"."github_installation"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pull_request" ADD CONSTRAINT "pull_request_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "code_review_settings_workspace_unique" ON "code_review_settings" USING btree ("workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_connection_member_unique" ON "github_connection" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "github_installation_id_unique" ON "github_installation" USING btree ("installation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "pull_request_installation_repo_number_unique" ON "pull_request" USING btree ("installation_id","repo_full_name","number");--> statement-breakpoint
CREATE INDEX "pull_request_workspace_issue_index" ON "pull_request" USING btree ("workspace_id","issue_id");