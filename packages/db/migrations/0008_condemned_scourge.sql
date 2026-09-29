CREATE TABLE "issue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status_id" uuid NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"assignee_id" uuid,
	"creator_id" uuid NOT NULL,
	"due_date" date,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"canceled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_number_check" CHECK ("issue"."number" > 0),
	CONSTRAINT "issue_priority_check" CHECK ("issue"."priority" between 0 and 4),
	CONSTRAINT "issue_sort_order_check" CHECK ("issue"."sort_order" >= 0)
);
--> statement-breakpoint
CREATE TABLE "issue_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"issue_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_event_type_check" CHECK ("issue_event"."type" in ('created', 'status', 'priority', 'assignee', 'title', 'description', 'due_date', 'team'))
);
--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "issue_counter" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_status_id_workflow_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."workflow_status"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_assignee_id_member_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_creator_id_member_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_actor_id_member_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "issue_team_number_unique" ON "issue" USING btree ("team_id","number");--> statement-breakpoint
CREATE INDEX "issue_workspace_team_index" ON "issue" USING btree ("workspace_id","team_id");--> statement-breakpoint
CREATE INDEX "issue_team_status_index" ON "issue" USING btree ("team_id","status_id");--> statement-breakpoint
CREATE INDEX "issue_event_workspace_issue_created_index" ON "issue_event" USING btree ("workspace_id","issue_id","created_at");