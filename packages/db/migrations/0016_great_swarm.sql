ALTER TABLE "issue" DROP CONSTRAINT "issue_creator_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "issue_event" DROP CONSTRAINT "issue_event_actor_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "issue_link" DROP CONSTRAINT "issue_link_creator_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "issue" ALTER COLUMN "creator_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "issue_event" ALTER COLUMN "actor_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "issue_link" ALTER COLUMN "creator_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "avatar_url" text;--> statement-breakpoint
ALTER TABLE "issue" ADD CONSTRAINT "issue_creator_id_member_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_event" ADD CONSTRAINT "issue_event_actor_id_member_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_link" ADD CONSTRAINT "issue_link_creator_id_member_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."member"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "member_workspace_username_unique" ON "member" USING btree ("workspace_id","username");