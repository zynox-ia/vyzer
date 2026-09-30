CREATE TYPE "public"."project_health" AS ENUM('on-track', 'at-risk', 'off-track', 'none');--> statement-breakpoint
CREATE TYPE "public"."project_priority" AS ENUM('none', 'urgent', 'high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('backlog', 'planned', 'started', 'completed', 'canceled');--> statement-breakpoint
CREATE TABLE "project" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" jsonb NOT NULL,
	"status" "project_status" NOT NULL,
	"health" "project_health" NOT NULL,
	"health_note" text,
	"priority" "project_priority",
	"lead_member_id" uuid,
	"target_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_team" (
	"project_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_team_project_id_team_id_pk" PRIMARY KEY("project_id","team_id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "project_id_workspace_unique" ON "project" USING btree ("id","workspace_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_id_workspace_unique" ON "team" USING btree ("id","workspace_id");--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_lead_member_id_member_id_fk" FOREIGN KEY ("lead_member_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team" ADD CONSTRAINT "project_team_project_workspace_fk" FOREIGN KEY ("project_id","workspace_id") REFERENCES "public"."project"("id","workspace_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_team" ADD CONSTRAINT "project_team_team_workspace_fk" FOREIGN KEY ("team_id","workspace_id") REFERENCES "public"."team"("id","workspace_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_workspace_created_index" ON "project" USING btree ("workspace_id","created_at","id");--> statement-breakpoint
CREATE INDEX "project_team_workspace_team_index" ON "project_team" USING btree ("workspace_id","team_id");--> statement-breakpoint
