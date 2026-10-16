import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "./index";
import * as schema from "./schema";

type DbSession = Pick<Db, "delete" | "insert" | "select" | "update">;

export type CodeReviewSettingsPatch = Partial<
  Pick<
    typeof schema.codeReviewSettings.$inferInsert,
    "enabled" | "autoConvertDraftPullRequests" | "mergeStrategy"
  >
>;

export type GithubInstallationValues = {
  installationId: string;
  accountId: string;
  accountLogin: string;
  accountType: string;
  installedByMemberId: string;
};

export type GithubPullRequestValues = {
  workspaceId: string;
  installationId: string;
  issueId: string | null;
  repoFullName: string;
  number: number;
  title: string;
  authorGithubLogin: string;
  url: string;
  state: schema.GithubPullRequestState;
  headBranch: string;
  checksStatus: schema.GithubChecksStatus | null;
  reviewDecision: schema.GithubReviewDecision | null;
  githubUpdatedAt: Date;
};

export class GithubInstallationConflictError extends Error {
  readonly code = "CONFLICT" as const;
}

export async function getOrCreateWorkspaceCodeReviewSettings(db: Db, workspaceId: string) {
  await db.insert(schema.codeReviewSettings).values({ workspaceId }).onConflictDoNothing();
  const [settings] = await db
    .select()
    .from(schema.codeReviewSettings)
    .where(eq(schema.codeReviewSettings.workspaceId, workspaceId))
    .limit(1);

  return settings ?? null;
}

export async function updateWorkspaceCodeReviewSettings(
  db: Db,
  workspaceId: string,
  values: CodeReviewSettingsPatch,
) {
  const now = new Date();
  return db.transaction(async (tx) => {
    await tx
      .insert(schema.codeReviewSettings)
      .values({ workspaceId, ...values, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.codeReviewSettings.workspaceId,
        set: { ...values, updatedAt: now },
      });

    if (values.enabled === false) {
      await tx
        .update(schema.pullRequest)
        .set({ issueId: null, updatedAt: now })
        .where(eq(schema.pullRequest.workspaceId, workspaceId));
    } else if (values.enabled === true) {
      const pullRequests = await tx
        .select({ id: schema.pullRequest.id, headBranch: schema.pullRequest.headBranch })
        .from(schema.pullRequest)
        .where(eq(schema.pullRequest.workspaceId, workspaceId));
      for (const pullRequest of pullRequests) {
        const issueId = await findWorkspaceIssueIdForGithubBranch(
          tx,
          workspaceId,
          pullRequest.headBranch,
        );
        await tx
          .update(schema.pullRequest)
          .set({ issueId, updatedAt: now })
          .where(eq(schema.pullRequest.id, pullRequest.id));
      }
    }

    await tx.insert(schema.codeReviewSettings).values({ workspaceId }).onConflictDoNothing();
    const [settings] = await tx
      .select()
      .from(schema.codeReviewSettings)
      .where(eq(schema.codeReviewSettings.workspaceId, workspaceId))
      .limit(1);
    return settings ?? null;
  });
}

export async function findWorkspaceGithubConnection(
  db: DbSession,
  workspaceId: string,
  memberId: string,
) {
  const [connection] = await db
    .select({
      githubUserId: schema.githubConnection.githubUserId,
      githubLogin: schema.githubConnection.githubLogin,
      githubAvatarUrl: schema.githubConnection.githubAvatarUrl,
      connectedAt: schema.githubConnection.connectedAt,
    })
    .from(schema.githubConnection)
    .where(
      and(
        eq(schema.githubConnection.workspaceId, workspaceId),
        eq(schema.githubConnection.memberId, memberId),
      ),
    )
    .limit(1);

  return connection ?? null;
}

export async function upsertWorkspaceGithubConnection(
  db: Db,
  workspaceId: string,
  memberId: string,
  values: { githubUserId: string; githubLogin: string; githubAvatarUrl: string | null },
) {
  const [connection] = await db
    .insert(schema.githubConnection)
    .values({ workspaceId, memberId, ...values, connectedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.githubConnection.memberId,
      set: { ...values, workspaceId, connectedAt: new Date() },
    })
    .returning();

  return connection ?? null;
}

export async function deleteWorkspaceGithubConnection(
  db: Db,
  workspaceId: string,
  memberId: string,
) {
  const [deleted] = await db
    .delete(schema.githubConnection)
    .where(
      and(
        eq(schema.githubConnection.workspaceId, workspaceId),
        eq(schema.githubConnection.memberId, memberId),
      ),
    )
    .returning({ memberId: schema.githubConnection.memberId });

  return deleted ?? null;
}

export async function findGithubInstallation(db: DbSession, installationId: string) {
  const [installation] = await db
    .select()
    .from(schema.githubInstallation)
    .where(eq(schema.githubInstallation.installationId, installationId))
    .limit(1);

  return installation ?? null;
}

export async function upsertWorkspaceGithubInstallation(
  db: Db,
  workspaceId: string,
  values: GithubInstallationValues,
) {
  const now = new Date();
  const [installation] = await db
    .insert(schema.githubInstallation)
    .values({ workspaceId, ...values, status: "active", updatedAt: now })
    .onConflictDoUpdate({
      target: schema.githubInstallation.installationId,
      set: {
        accountId: values.accountId,
        accountLogin: values.accountLogin,
        accountType: values.accountType,
        installedByMemberId: values.installedByMemberId,
        status: "active",
        updatedAt: now,
      },
      where: sql`github_installation.workspace_id = excluded."workspace_id"`,
    })
    .returning();

  if (!installation) {
    const existing = await findGithubInstallation(db, values.installationId);
    if (existing && existing.workspaceId !== workspaceId) {
      throw new GithubInstallationConflictError(
        "The GitHub installation is already associated with another Workspace.",
      );
    }
    return null;
  }
  if (installation.workspaceId !== workspaceId) {
    throw new GithubInstallationConflictError(
      "The GitHub installation is already associated with another Workspace.",
    );
  }

  return installation;
}

export async function setWorkspaceGithubInstallationStatus(
  db: Db,
  installationId: string,
  status: schema.GithubInstallationStatus,
) {
  const [installation] = await db
    .update(schema.githubInstallation)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.githubInstallation.installationId, installationId))
    .returning({ id: schema.githubInstallation.id });

  return installation ?? null;
}

export function githubIssueIdentifiersFromBranch(branch: string) {
  const identifiers = new Set<string>();
  for (const match of branch.matchAll(/(?:^|[^a-z0-9])([a-z][a-z0-9]*-\d+)(?![a-z0-9])/gi)) {
    const identifier = match[1];
    if (identifier) identifiers.add(identifier.toLowerCase());
  }
  return [...identifiers];
}

export async function findWorkspaceIssueIdForGithubBranch(
  db: DbSession,
  workspaceId: string,
  branch: string,
) {
  const identifiers = githubIssueIdentifiersFromBranch(branch);
  if (identifiers.length === 0) return null;

  const matches = await db
    .select({ id: schema.issue.id })
    .from(schema.issue)
    .innerJoin(
      schema.team,
      and(eq(schema.team.id, schema.issue.teamId), eq(schema.team.workspaceId, workspaceId)),
    )
    .where(
      and(
        eq(schema.issue.workspaceId, workspaceId),
        inArray(
          sql<string>`lower(${schema.team.key} || '-' || ${schema.issue.number}::text)`,
          identifiers,
        ),
      ),
    )
    .limit(2);

  return matches.length === 1 ? (matches[0]?.id ?? null) : null;
}

export async function upsertWorkspaceGithubPullRequest(db: Db, values: GithubPullRequestValues) {
  const now = new Date();
  const [pullRequest] = await db
    .insert(schema.pullRequest)
    .values({ ...values, updatedAt: now })
    .onConflictDoUpdate({
      target: [
        schema.pullRequest.installationId,
        schema.pullRequest.repoFullName,
        schema.pullRequest.number,
      ],
      set: {
        workspaceId: values.workspaceId,
        issueId: values.issueId,
        title: values.title,
        authorGithubLogin: values.authorGithubLogin,
        url: values.url,
        state: values.state,
        headBranch: values.headBranch,
        checksStatus: values.checksStatus,
        reviewDecision: values.reviewDecision,
        githubUpdatedAt: values.githubUpdatedAt,
        updatedAt: now,
      },
      where: sql`excluded."github_updated_at" >= ${schema.pullRequest.githubUpdatedAt}`,
    })
    .returning({ id: schema.pullRequest.id });

  return pullRequest ?? null;
}

export async function listWorkspaceIssuePullRequests(
  db: DbSession,
  workspaceId: string,
  issueId: string,
) {
  return db
    .select({
      id: schema.pullRequest.id,
      title: schema.pullRequest.title,
      number: schema.pullRequest.number,
      repoFullName: schema.pullRequest.repoFullName,
      authorLogin: schema.pullRequest.authorGithubLogin,
      url: schema.pullRequest.url,
      state: schema.pullRequest.state,
      checksStatus: schema.pullRequest.checksStatus,
      reviewDecision: schema.pullRequest.reviewDecision,
    })
    .from(schema.pullRequest)
    .where(
      and(eq(schema.pullRequest.workspaceId, workspaceId), eq(schema.pullRequest.issueId, issueId)),
    )
    .orderBy(schema.pullRequest.number);
}
