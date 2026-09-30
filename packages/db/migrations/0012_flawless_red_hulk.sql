CREATE TABLE "issue_link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"issue_id" uuid NOT NULL,
	"url" text NOT NULL,
	"title" text,
	"creator_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_link_http_url_check" CHECK (lower("issue_link"."url") like 'http://%' or lower("issue_link"."url") like 'https://%')
);
--> statement-breakpoint
CREATE TABLE "issue_relation" (
	"issue_id" uuid NOT NULL,
	"related_issue_id" uuid NOT NULL,
	"type" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "issue_relation_issue_id_related_issue_id_type_pk" PRIMARY KEY("issue_id","related_issue_id","type"),
	CONSTRAINT "issue_relation_type_check" CHECK ("issue_relation"."type" in ('blocks', 'related', 'duplicate')),
	CONSTRAINT "issue_relation_not_self_check" CHECK ("issue_relation"."issue_id" <> "issue_relation"."related_issue_id")
);
--> statement-breakpoint
ALTER TABLE "issue_event" DROP CONSTRAINT "issue_event_type_check";--> statement-breakpoint
ALTER TABLE "issue_link" ADD CONSTRAINT "issue_link_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_link" ADD CONSTRAINT "issue_link_creator_id_member_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_relation" ADD CONSTRAINT "issue_relation_issue_id_issue_id_fk" FOREIGN KEY ("issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_relation" ADD CONSTRAINT "issue_relation_related_issue_id_issue_id_fk" FOREIGN KEY ("related_issue_id") REFERENCES "public"."issue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "issue_link_issue_created_index" ON "issue_link" USING btree ("issue_id","created_at");--> statement-breakpoint
CREATE INDEX "issue_relation_related_index" ON "issue_relation" USING btree ("related_issue_id","type");--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_type_check" CHECK ("issue_event"."type" in ('created', 'status', 'priority', 'assignee', 'title', 'description', 'due_date', 'label_added', 'label_removed', 'team', 'relation_added', 'relation_removed'));