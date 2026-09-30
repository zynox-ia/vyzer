ALTER TABLE "project" DROP CONSTRAINT "project_lead_member_workspace_fk";
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_lead_member_workspace_fk" FOREIGN KEY ("lead_member_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE set null ("lead_member_id") ON UPDATE no action;
