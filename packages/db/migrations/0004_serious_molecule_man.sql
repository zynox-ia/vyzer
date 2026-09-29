ALTER TABLE "workspace" ADD COLUMN "slug" text;
--> statement-breakpoint
UPDATE "workspace" SET "slug" = 'zynox-dev';
--> statement-breakpoint
ALTER TABLE "workspace" ALTER COLUMN "slug" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "workspace" ADD COLUMN "fiscal_year_start_month" integer DEFAULT 1 NOT NULL;