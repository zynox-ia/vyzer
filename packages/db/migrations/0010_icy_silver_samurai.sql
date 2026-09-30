CREATE UNIQUE INDEX "member_id_workspace_unique" ON "member" USING btree ("id","workspace_id");
--> statement-breakpoint
ALTER TABLE "project" DROP CONSTRAINT "project_lead_member_id_member_id_fk";
--> statement-breakpoint
ALTER TABLE "project" ADD CONSTRAINT "project_lead_member_workspace_fk" FOREIGN KEY ("lead_member_id","workspace_id") REFERENCES "public"."member"("id","workspace_id") ON DELETE no action ON UPDATE no action;
