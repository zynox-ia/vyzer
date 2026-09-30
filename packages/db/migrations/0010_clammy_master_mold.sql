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
ALTER TABLE "issue_event" DROP CONSTRAINT "issue_event_type_check";--> statement-breakpoint
ALTER TABLE "issue_label" ADD CONSTRAINT "issue_label_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_label" ADD CONSTRAINT "issue_label_label_id_label_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_team_id_team_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."team"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "label" ADD CONSTRAINT "label_parent_id_label_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."label"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_label_label_index" ON "issue_label" USING btree ("label_id");--> statement-breakpoint
CREATE UNIQUE INDEX "label_workspace_name_unique" ON "label" USING btree ("workspace_id",lower("name")) WHERE "label"."team_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "label_team_name_unique" ON "label" USING btree ("team_id",lower("name")) WHERE "label"."team_id" is not null;--> statement-breakpoint
CREATE INDEX "label_parent_index" ON "label" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "label_workspace_team_index" ON "label" USING btree ("workspace_id","team_id");--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_type_check" CHECK ("issue_event"."type" in ('created', 'status', 'priority', 'assignee', 'title', 'description', 'due_date', 'label_added', 'label_removed', 'team'));