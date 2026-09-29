CREATE TABLE "workflow_status" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"color" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_status_category_check" CHECK ("workflow_status"."category" in ('triage', 'backlog', 'unstarted', 'started', 'completed', 'canceled', 'duplicate')),
	CONSTRAINT "workflow_status_color_check" CHECK ("workflow_status"."color" in ('grey', 'slate', 'purple', 'cyan', 'green', 'amber', 'orange', 'pink', 'red')),
	CONSTRAINT "workflow_status_position_check" CHECK ("workflow_status"."position" >= 0)
);
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "default_status_id" uuid;--> statement-breakpoint
ALTER TABLE "workflow_status" ADD CONSTRAINT "workflow_status_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_status_team_category_name_unique" ON "workflow_status" USING btree ("team_id","category","name");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_status_team_duplicate_unique" ON "workflow_status" USING btree ("team_id") WHERE "workflow_status"."category" = 'duplicate';--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_default_status_id_workflow_status_id_fk" FOREIGN KEY ("default_status_id") REFERENCES "public"."workflow_status"("id") ON DELETE set null ON UPDATE no action;