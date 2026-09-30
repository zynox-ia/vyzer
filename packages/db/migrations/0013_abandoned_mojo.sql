ALTER TABLE "issue_link" DROP CONSTRAINT "issue_link_creator_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "issue_link" ADD CONSTRAINT "issue_link_creator_id_member_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;