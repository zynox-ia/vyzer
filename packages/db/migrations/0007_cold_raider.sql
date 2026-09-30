CREATE TYPE "public"."team_estimation" AS ENUM('none', 'exponential', 'fibonacci', 'linear', 'tshirt');--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "timezone" text DEFAULT 'America/Sao_Paulo' NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "estimation" "team_estimation" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "detailed_issue_history" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "issue_email_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "team" ADD COLUMN "issue_email_address" text;--> statement-breakpoint
UPDATE "team"
SET "issue_email_address" = "slug" || '-' || substr(md5("id"::text), 1, 12) || '@intake.vyzer.app.br';--> statement-breakpoint
ALTER TABLE "team" ALTER COLUMN "issue_email_address" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "team_issue_email_address_unique" ON "team" USING btree ("issue_email_address");
