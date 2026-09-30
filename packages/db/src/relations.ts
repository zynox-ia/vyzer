import { and, asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Db } from "./index";
import { insertWorkspaceIssueEvent, insertWorkspaceIssueEvents } from "./issue-events";
import * as schema from "./schema";

type DbSession = Pick<Db, "delete" | "execute" | "insert" | "select" | "update">;
type IssueRelationType = schema.IssueRelationType;

export class IssueRelationRuleError extends Error {
  readonly code = "BAD_REQUEST" as const;
}

export type IssueRelationSummary = {
  id: string;
  identifier: string;
  title: string;
};

export type IssueRelationGroups = {
  blockedBy: IssueRelationSummary[];
  blocking: IssueRelationSummary[];
  related: IssueRelationSummary[];
  duplicateOf: IssueRelationSummary[];
};

type RelationDetails = {
  relations: IssueRelationGroups;
  links: Array<typeof schema.issueLink.$inferSelect>;
};

function normalizedRelatedPair(issueId: string, relatedIssueId: string) {
  return issueId < relatedIssueId
    ? { issueId, relatedIssueId }
    : { issueId: relatedIssueId, relatedIssueId: issueId };
}

async function lockWorkspace(tx: DbSession, workspaceId: string) {
  await tx
    .select({ id: schema.workspace.id })
    .from(schema.workspace)
    .where(eq(schema.workspace.id, workspaceId))
    .for("update");
}

function relationPayload(
  type: IssueRelationType,
  direction: "blocking" | "blockedBy" | "related" | "duplicateOf" | "duplicateTarget",
  other: { id: string; identifier: string },
) {
  return { type, direction, relatedIssueId: other.id, relatedIdentifier: other.identifier };
}

export async function addWorkspaceIssueRelation(
  db: Db,
  workspaceId: string,
  actorId: string,
  issueId: string,
  relatedIssueId: string,
  type: IssueRelationType,
) {
  if (issueId === relatedIssueId) {
    throw new IssueRelationRuleError("An Issue cannot have a relation to itself.");
  }

  return db.transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);

    const currentStatus = alias(schema.workflowStatus, "relation_current_status");
    const currentTeam = alias(schema.team, "relation_current_team");
    const lockedIssues = await tx
      .select({
        id: schema.issue.id,
        workspaceId: schema.issue.workspaceId,
        teamId: schema.issue.teamId,
        number: schema.issue.number,
        title: schema.issue.title,
        statusId: schema.issue.statusId,
        statusName: currentStatus.name,
        statusCategory: currentStatus.category,
        startedAt: schema.issue.startedAt,
        completedAt: schema.issue.completedAt,
        canceledAt: schema.issue.canceledAt,
        teamKey: currentTeam.key,
      })
      .from(schema.issue)
      .innerJoin(
        currentTeam,
        and(eq(currentTeam.id, schema.issue.teamId), eq(currentTeam.workspaceId, workspaceId)),
      )
      .innerJoin(
        currentStatus,
        and(
          eq(currentStatus.id, schema.issue.statusId),
          eq(currentStatus.teamId, schema.issue.teamId),
        ),
      )
      .where(
        and(
          eq(schema.issue.workspaceId, workspaceId),
          inArray(schema.issue.id, [issueId, relatedIssueId]),
        ),
      )
      .orderBy(asc(schema.issue.id))
      .for("update");
    const issueById = new Map(lockedIssues.map((current) => [current.id, current]));
    const currentIssue = issueById.get(issueId);
    if (!currentIssue) return null;
    const relatedIssue = issueById.get(relatedIssueId);
    if (!relatedIssue) {
      throw new IssueRelationRuleError("Related Issues must belong to the current Workspace.");
    }

    const pair =
      type === "related"
        ? normalizedRelatedPair(issueId, relatedIssueId)
        : { issueId, relatedIssueId };
    const existingRelation = await tx
      .select({ issueId: schema.issueRelation.issueId })
      .from(schema.issueRelation)
      .where(
        and(
          eq(schema.issueRelation.issueId, pair.issueId),
          eq(schema.issueRelation.relatedIssueId, pair.relatedIssueId),
          eq(schema.issueRelation.type, type),
        ),
      )
      .limit(1);
    if (existingRelation.length > 0) return true;

    if (type === "duplicate") {
      const [existingDuplicate] = await tx
        .select({ relatedIssueId: schema.issueRelation.relatedIssueId })
        .from(schema.issueRelation)
        .where(
          and(
            eq(schema.issueRelation.issueId, issueId),
            eq(schema.issueRelation.type, "duplicate"),
          ),
        )
        .limit(1);
      if (existingDuplicate) {
        throw new IssueRelationRuleError("An Issue can only be a duplicate of one other Issue.");
      }
    }

    let duplicateStatus:
      | Pick<typeof schema.workflowStatus.$inferSelect, "id" | "name" | "category">
      | undefined;
    if (type === "duplicate") {
      [duplicateStatus] = await tx
        .select({
          id: schema.workflowStatus.id,
          name: schema.workflowStatus.name,
          category: schema.workflowStatus.category,
        })
        .from(schema.workflowStatus)
        .where(
          and(
            eq(schema.workflowStatus.teamId, currentIssue.teamId),
            eq(schema.workflowStatus.category, "duplicate"),
          ),
        )
        .limit(1)
        .for("share");
      if (!duplicateStatus) {
        throw new IssueRelationRuleError("The Issue's Team has no Duplicate Status.");
      }
    }

    const now = new Date();
    await tx.insert(schema.issueRelation).values({ ...pair, type, createdAt: now });

    if (duplicateStatus && duplicateStatus.id !== currentIssue.statusId) {
      await tx
        .update(schema.issue)
        .set({
          statusId: duplicateStatus.id,
          completedAt: null,
          canceledAt: null,
          updatedAt: now,
        })
        .where(and(eq(schema.issue.id, issueId), eq(schema.issue.workspaceId, workspaceId)));
      await insertWorkspaceIssueEvent(tx, {
        workspaceId,
        issueId,
        actorId,
        type: "status",
        payload: {
          from: {
            id: currentIssue.statusId,
            name: currentIssue.statusName,
            category: currentIssue.statusCategory,
          },
          to: {
            id: duplicateStatus.id,
            name: duplicateStatus.name,
            category: duplicateStatus.category,
          },
        },
        createdAt: now,
      });
    }

    const sourceIdentifier = `${currentIssue.teamKey}-${currentIssue.number}`;
    const relatedIdentifier = `${relatedIssue.teamKey}-${relatedIssue.number}`;
    const sourceDirection =
      type === "blocks" ? "blocking" : type === "duplicate" ? "duplicateOf" : "related";
    const targetDirection =
      type === "blocks" ? "blockedBy" : type === "duplicate" ? "duplicateTarget" : "related";
    const createdAtOffset = duplicateStatus && duplicateStatus.id !== currentIssue.statusId ? 1 : 0;

    await insertWorkspaceIssueEvents(tx, [
      {
        workspaceId,
        issueId,
        actorId,
        type: "relation_added",
        payload: relationPayload(type, sourceDirection, {
          id: relatedIssue.id,
          identifier: relatedIdentifier,
        }),
        createdAt: new Date(now.getTime() + createdAtOffset),
      },
      {
        workspaceId,
        issueId: relatedIssue.id,
        actorId,
        type: "relation_added",
        payload: relationPayload(type, targetDirection, {
          id: currentIssue.id,
          identifier: sourceIdentifier,
        }),
        createdAt: new Date(now.getTime() + createdAtOffset + 1),
      },
    ]);

    return true;
  });
}

export async function removeWorkspaceIssueRelation(
  db: Db,
  workspaceId: string,
  actorId: string,
  issueId: string,
  relatedIssueId: string,
  type: IssueRelationType,
) {
  if (issueId === relatedIssueId) {
    throw new IssueRelationRuleError("An Issue cannot have a relation to itself.");
  }

  return db.transaction(async (tx) => {
    await lockWorkspace(tx, workspaceId);
    const [currentIssue] = await tx
      .select({ id: schema.issue.id, teamId: schema.issue.teamId, number: schema.issue.number })
      .from(schema.issue)
      .where(and(eq(schema.issue.id, issueId), eq(schema.issue.workspaceId, workspaceId)))
      .limit(1)
      .for("update");
    if (!currentIssue) return null;

    const [relatedIssue] = await tx
      .select({ id: schema.issue.id, teamId: schema.issue.teamId, number: schema.issue.number })
      .from(schema.issue)
      .where(and(eq(schema.issue.id, relatedIssueId), eq(schema.issue.workspaceId, workspaceId)))
      .limit(1)
      .for("update");
    if (!relatedIssue) {
      throw new IssueRelationRuleError("Related Issues must belong to the current Workspace.");
    }

    const pair =
      type === "related"
        ? normalizedRelatedPair(issueId, relatedIssueId)
        : { issueId, relatedIssueId };
    const [deletedRelation] = await tx
      .delete(schema.issueRelation)
      .where(
        and(
          eq(schema.issueRelation.issueId, pair.issueId),
          eq(schema.issueRelation.relatedIssueId, pair.relatedIssueId),
          eq(schema.issueRelation.type, type),
        ),
      )
      .returning({ issueId: schema.issueRelation.issueId });
    if (!deletedRelation) return false;

    const currentTeam = alias(schema.team, "relation_remove_current_team");
    const relatedTeam = alias(schema.team, "relation_remove_related_team");
    const [currentTeamInfo] = await tx
      .select({ key: currentTeam.key })
      .from(currentTeam)
      .where(and(eq(currentTeam.id, currentIssue.teamId), eq(currentTeam.workspaceId, workspaceId)))
      .limit(1);
    const [relatedTeamInfo] = await tx
      .select({ key: relatedTeam.key })
      .from(relatedTeam)
      .where(and(eq(relatedTeam.id, relatedIssue.teamId), eq(relatedTeam.workspaceId, workspaceId)))
      .limit(1);
    if (!currentTeamInfo || !relatedTeamInfo) {
      throw new IssueRelationRuleError("Related Issues must belong to the current Workspace.");
    }

    const currentIdentifier = `${currentTeamInfo.key}-${currentIssue.number}`;
    const relatedIdentifier = `${relatedTeamInfo.key}-${relatedIssue.number}`;
    const sourceDirection =
      type === "blocks" ? "blocking" : type === "duplicate" ? "duplicateOf" : "related";
    const targetDirection =
      type === "blocks" ? "blockedBy" : type === "duplicate" ? "duplicateTarget" : "related";
    const now = new Date();
    await insertWorkspaceIssueEvents(tx, [
      {
        workspaceId,
        issueId,
        actorId,
        type: "relation_removed",
        payload: relationPayload(type, sourceDirection, {
          id: relatedIssue.id,
          identifier: relatedIdentifier,
        }),
        createdAt: now,
      },
      {
        workspaceId,
        issueId: relatedIssue.id,
        actorId,
        type: "relation_removed",
        payload: relationPayload(type, targetDirection, {
          id: currentIssue.id,
          identifier: currentIdentifier,
        }),
        createdAt: new Date(now.getTime() + 1),
      },
    ]);

    return true;
  });
}

export async function addWorkspaceIssueLink(
  db: Db,
  workspaceId: string,
  creatorId: string,
  issueId: string,
  values: { url: string; title?: string },
) {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(values.url);
  } catch {
    throw new IssueRelationRuleError("A valid http or https URL is required.");
  }
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new IssueRelationRuleError("Only http and https links are supported.");
  }

  const [currentIssue] = await db
    .select({ id: schema.issue.id })
    .from(schema.issue)
    .where(and(eq(schema.issue.id, issueId), eq(schema.issue.workspaceId, workspaceId)))
    .limit(1);
  if (!currentIssue) return null;

  const [createdLink] = await db
    .insert(schema.issueLink)
    .values({ issueId, url: values.url, title: values.title ?? null, creatorId })
    .returning();
  return createdLink ?? null;
}

export async function removeWorkspaceIssueLink(db: Db, workspaceId: string, id: string) {
  const [deletedLink] = await db
    .delete(schema.issueLink)
    .where(
      and(
        eq(schema.issueLink.id, id),
        inArray(
          schema.issueLink.issueId,
          db
            .select({ id: schema.issue.id })
            .from(schema.issue)
            .where(eq(schema.issue.workspaceId, workspaceId)),
        ),
      ),
    )
    .returning();
  return deletedLink ?? null;
}

export async function listWorkspaceIssueRelationDetails(
  db: DbSession,
  workspaceId: string,
  issueId: string,
): Promise<RelationDetails> {
  const otherIssue = alias(schema.issue, "relation_other_issue");
  const otherTeam = alias(schema.team, "relation_other_team");
  const outgoing = await db
    .select({
      type: schema.issueRelation.type,
      id: otherIssue.id,
      number: otherIssue.number,
      title: otherIssue.title,
      key: otherTeam.key,
    })
    .from(schema.issueRelation)
    .innerJoin(otherIssue, eq(otherIssue.id, schema.issueRelation.relatedIssueId))
    .innerJoin(
      otherTeam,
      and(eq(otherTeam.id, otherIssue.teamId), eq(otherTeam.workspaceId, workspaceId)),
    )
    .where(and(eq(schema.issueRelation.issueId, issueId), eq(otherIssue.workspaceId, workspaceId)))
    .orderBy(asc(otherTeam.key), asc(otherIssue.number));
  const sourceIssue = alias(schema.issue, "relation_source_issue");
  const sourceTeam = alias(schema.team, "relation_source_team");
  const incoming = await db
    .select({
      type: schema.issueRelation.type,
      id: sourceIssue.id,
      number: sourceIssue.number,
      title: sourceIssue.title,
      key: sourceTeam.key,
    })
    .from(schema.issueRelation)
    .innerJoin(sourceIssue, eq(sourceIssue.id, schema.issueRelation.issueId))
    .innerJoin(
      sourceTeam,
      and(eq(sourceTeam.id, sourceIssue.teamId), eq(sourceTeam.workspaceId, workspaceId)),
    )
    .where(
      and(
        eq(schema.issueRelation.relatedIssueId, issueId),
        eq(sourceIssue.workspaceId, workspaceId),
        inArray(schema.issueRelation.type, ["blocks", "related"]),
      ),
    )
    .orderBy(asc(sourceTeam.key), asc(sourceIssue.number));
  const links = await db
    .select({
      id: schema.issueLink.id,
      issueId: schema.issueLink.issueId,
      url: schema.issueLink.url,
      title: schema.issueLink.title,
      creatorId: schema.issueLink.creatorId,
      createdAt: schema.issueLink.createdAt,
    })
    .from(schema.issueLink)
    .innerJoin(schema.issue, eq(schema.issue.id, schema.issueLink.issueId))
    .where(and(eq(schema.issueLink.issueId, issueId), eq(schema.issue.workspaceId, workspaceId)))
    .orderBy(asc(schema.issueLink.createdAt), asc(schema.issueLink.id));

  const groups: IssueRelationGroups = { blockedBy: [], blocking: [], related: [], duplicateOf: [] };
  for (const current of outgoing) {
    const summary = {
      id: current.id,
      identifier: `${current.key}-${current.number}`,
      title: current.title,
    };
    if (current.type === "blocks") groups.blocking.push(summary);
    else if (current.type === "duplicate") groups.duplicateOf.push(summary);
    else groups.related.push(summary);
  }
  for (const current of incoming) {
    const summary = {
      id: current.id,
      identifier: `${current.key}-${current.number}`,
      title: current.title,
    };
    if (current.type === "blocks") groups.blockedBy.push(summary);
    else groups.related.push(summary);
  }

  return { relations: groups, links };
}
