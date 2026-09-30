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
	"parent_id" uuid,
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
	CONSTRAINT "issue_event_type_check" CHECK ("issue_event"."type" in ('created', 'status', 'priority', 'assignee', 'title', 'description', 'due_date', 'label_added', 'label_removed', 'team'))
);
--> statement-breakpoint
CREATE TABLE "issue_label" (
	"issue_id" uuid NOT NULL,
	"label_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_label_issue_id_label_id_pk" PRIMARY KEY("issue_id","label_id")
);
--> statement-breakpoint
CREATE TABLE "label" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"team_id" uuid,
	"parent_id" uuid,
	"is_group" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text DEFAULT 'grey' NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "label_color_check" CHECK ("label"."color" in ('grey', 'slate', 'purple', 'cyan', 'green', 'amber', 'orange', 'pink', 'red')),
	CONSTRAINT "label_not_own_parent_check" CHECK ("label"."parent_id" is null or "label"."parent_id" <> "label"."id")
);
--> statement-breakpoint
CREATE TABLE "notification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"type" text NOT NULL,
	"actor_id" uuid,
	"issue_id" uuid,
	"project_id" uuid,
	"issue_event_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"read_at" timestamp with time zone,
	"snoozed_until" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "notification_type_check" CHECK ("notification"."type" in ('assigned', 'unassigned')),
	CONSTRAINT "notification_target_check" CHECK (("notification"."issue_id" is not null and "notification"."project_id" is null) or ("notification"."issue_id" is null and "notification"."project_id" is not null))
);
--> statement-breakpoint
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
ALTER TABLE "team" ADD COLUMN "issue_counter" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_status_id_workflow_status_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."workflow_status"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_assignee_id_member_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_creator_id_member_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_parent_id_issue_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."issue"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_actor_id_member_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_label" ADD CONSTRAINT "issue_label_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_label" ADD CONSTRAINT "issue_label_label_id_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_parent_id_label_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_member_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_id_member_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_issue_event_id_issue_event_id_fk" FOREIGN KEY ("issue_event_id") REFERENCES "public"."issue_event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_status" ADD CONSTRAINT "workflow_status_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "issue_team_number_unique" ON "issue" USING btree ("team_id","number");--> statement-breakpoint
CREATE INDEX "issue_workspace_team_index" ON "issue" USING btree ("workspace_id","team_id");--> statement-breakpoint
CREATE INDEX "issue_team_status_index" ON "issue" USING btree ("team_id","status_id");--> statement-breakpoint
CREATE INDEX "issue_parent_index" ON "issue" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "issue_event_workspace_issue_created_index" ON "issue_event" USING btree ("workspace_id","issue_id","created_at");--> statement-breakpoint
CREATE INDEX "issue_label_label_index" ON "issue_label" USING btree ("label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "label_workspace_name_unique" ON "label" USING btree ("workspace_id",lower("name")) WHERE "label"."team_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "label_team_name_unique" ON "label" USING btree ("team_id",lower("name")) WHERE "label"."team_id" is not null;--> statement-breakpoint
CREATE INDEX "label_parent_index" ON "label" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "label_workspace_team_index" ON "label" USING btree ("workspace_id","team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_recipient_issue_event_unique" ON "notification" USING btree ("recipient_id","issue_event_id") WHERE "notification"."issue_event_id" is not null;--> statement-breakpoint
CREATE INDEX "notification_recipient_archived_created_index" ON "notification" USING btree ("recipient_id","archived_at","created_at" desc);--> statement-breakpoint
CREATE INDEX "notification_unread_recipient_index" ON "notification" USING btree ("recipient_id","created_at") WHERE "notification"."read_at" is null and "notification"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "notification_issue_index" ON "notification" USING btree ("issue_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_status_team_category_name_unique" ON "workflow_status" USING btree ("team_id","category","name");--> statement-breakpoint
CREATE UNIQUE INDEX "workflow_status_team_duplicate_unique" ON "workflow_status" USING btree ("team_id") WHERE "workflow_status"."category" = 'duplicate';--> statement-breakpoint
ALTER TABLE "team" ADD CONSTRAINT "team_default_status_id_workflow_status_id_fk" FOREIGN KEY ("default_status_id") REFERENCES "public"."workflow_status"("id") ON DELETE set null ON UPDATE no action;