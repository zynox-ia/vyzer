import { randomBytes } from "node:crypto";

/** Domain for generated issue intake addresses. */
export const TEAM_ISSUE_EMAIL_DOMAIN = "intake.zynox.app.br";

/** Generate an opaque, per-Team intake address using a cryptographically random suffix. */
export function createTeamIssueEmailAddress(slug: string): string {
  return `${slug}-${randomBytes(6).toString("hex")}@${TEAM_ISSUE_EMAIL_DOMAIN}`;
}
