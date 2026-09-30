import { and, desc, eq } from "drizzle-orm";
import type { Db } from "./index";
import { createWorkspaceIssueInTransaction } from "./issues";
import * as schema from "./schema";

export class IssueDraftRuleError extends Error {
  readonly code = "BAD_REQUEST" as const;
}

export type IssueDraftValues = {
  teamId?: string | null;
  title?: string;
  description?: string | null;
};

export async function createWorkspaceIssueDraft(
  db: Db,
  workspaceId: string,
  creatorId: string,
  values: IssueDraftValues,
) {
  if (values.teamId) {
    const [team] = await db
      .select({ id: schema.team.id })
      .from(schema.team)
      .where(and(eq(schema.team.id, values.teamId), eq(schema.team.workspaceId, workspaceId)))
      .limit(1);
    if (!team) return null;
  }

  const [created] = await db
    .insert(schema.issueDraft)
    .values({
      workspaceId,
      creatorId,
      teamId: values.teamId ?? null,
      title: values.title ?? "",
      description: values.description ?? null,
    })
    .returning();

  return created ?? null;
}

export async function listWorkspaceIssueDrafts(db: Db, workspaceId: string, creatorId: string) {
  return db
    .select()
    .from(schema.issueDraft)
    .where(
      and(
        eq(schema.issueDraft.workspaceId, workspaceId),
        eq(schema.issueDraft.creatorId, creatorId),
      ),
    )
    .orderBy(desc(schema.issueDraft.updatedAt), desc(schema.issueDraft.id));
}

export async function updateWorkspaceIssueDraft(
  db: Db,
  workspaceId: string,
  creatorId: string,
  id: string,
  values: IssueDraftValues,
) {
  if (values.teamId) {
    const [team] = await db
      .select({ id: schema.team.id })
      .from(schema.team)
      .where(and(eq(schema.team.id, values.teamId), eq(schema.team.workspaceId, workspaceId)))
      .limit(1);
    if (!team) return null;
  }

  const patch = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(patch).length === 0) {
    const [draft] = await db
      .select()
      .from(schema.issueDraft)
      .where(
        and(
          eq(schema.issueDraft.id, id),
          eq(schema.issueDraft.workspaceId, workspaceId),
          eq(schema.issueDraft.creatorId, creatorId),
        ),
      )
      .limit(1);
    return draft ?? null;
  }

  const [updated] = await db
    .update(schema.issueDraft)
    .set({ ...patch, updatedAt: new Date() })
    .where(
      and(
        eq(schema.issueDraft.id, id),
        eq(schema.issueDraft.workspaceId, workspaceId),
        eq(schema.issueDraft.creatorId, creatorId),
      ),
    )
    .returning();

  return updated ?? null;
}

export async function discardWorkspaceIssueDraft(
  db: Db,
  workspaceId: string,
  creatorId: string,
  id: string,
) {
  const [discarded] = await db
    .delete(schema.issueDraft)
    .where(
      and(
        eq(schema.issueDraft.id, id),
        eq(schema.issueDraft.workspaceId, workspaceId),
        eq(schema.issueDraft.creatorId, creatorId),
      ),
    )
    .returning({ id: schema.issueDraft.id });

  return discarded ?? null;
}

export async function publishWorkspaceIssueDraft(
  db: Db,
  workspaceId: string,
  creatorId: string,
  id: string,
) {
  return db.transaction(async (tx) => {
    const [draft] = await tx
      .select()
      .from(schema.issueDraft)
      .where(
        and(
          eq(schema.issueDraft.id, id),
          eq(schema.issueDraft.workspaceId, workspaceId),
          eq(schema.issueDraft.creatorId, creatorId),
        ),
      )
      .limit(1)
      .for("update");

    if (!draft) return null;
    if (!draft.title.trim()) {
      throw new IssueDraftRuleError("Add a title before publishing this draft.");
    }
    if (!draft.teamId) {
      throw new IssueDraftRuleError("Choose a Team before publishing this draft.");
    }

    const [currentTeam] = await tx
      .select({ slug: schema.team.slug })
      .from(schema.team)
      .where(and(eq(schema.team.id, draft.teamId), eq(schema.team.workspaceId, workspaceId)))
      .limit(1)
      .for("share");
    if (!currentTeam) {
      throw new IssueDraftRuleError("Choose a Team before publishing this draft.");
    }

    const issue = await createWorkspaceIssueInTransaction(
      tx,
      workspaceId,
      creatorId,
      currentTeam.slug,
      { title: draft.title.trim(), description: draft.description },
    );
    if (!issue) return null;

    await tx.delete(schema.issueDraft).where(eq(schema.issueDraft.id, draft.id));
    return issue;
  });
}
