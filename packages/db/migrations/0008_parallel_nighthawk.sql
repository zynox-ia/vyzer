ALTER TABLE "team" ALTER COLUMN "issue_email_address" SET DEFAULT ('team-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12) || '@intake.vyzer.app.br');--> statement-breakpoint
UPDATE "team"
SET "issue_email_address" = left("issue_email_address", length("issue_email_address") - length('@intake.vyzer.local')) || '@intake.vyzer.app.br'
WHERE right("issue_email_address", length('@intake.vyzer.local')) = '@intake.vyzer.local';
