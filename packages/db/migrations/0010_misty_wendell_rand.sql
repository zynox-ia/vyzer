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
ALTER TABLE "notification" ADD CONSTRAINT "notification_workspace_id_workspace_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspace"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_recipient_id_member_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_actor_id_member_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_issue_event_id_issue_event_id_fk" FOREIGN KEY ("issue_event_id") REFERENCES "public"."issue_event"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "notification_recipient_issue_event_unique" ON "notification" USING btree ("recipient_id","issue_event_id") WHERE "notification"."issue_event_id" is not null;--> statement-breakpoint
CREATE INDEX "notification_recipient_archived_created_index" ON "notification" USING btree ("recipient_id","archived_at","created_at" desc);--> statement-breakpoint
CREATE INDEX "notification_unread_recipient_index" ON "notification" USING btree ("recipient_id","created_at") WHERE "notification"."read_at" is null and "notification"."archived_at" is null;--> statement-breakpoint
CREATE INDEX "notification_issue_index" ON "notification" USING btree ("issue_id");