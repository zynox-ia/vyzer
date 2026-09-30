import { and, asc, eq, inArray, isNull, max, ne, or, sql } from "drizzle-orm";
import type { Db } from "./index";
import { insertWorkspaceIssueEvents } from "./issue-events";
import * as schema from "./schema";

type DbSession = Pick<Db, "delete" | "execute" | "insert" | "select" | "update">;
type LabelRow = typeof schema.label.$inferSelect;
type LabelValues = Partial<Pick<LabelRow, "name" | "description" | "color">>;

const reservedLabelNames = new Set([
  "assignee",
  "cycle",
  "effort",
  "estimate",
  "hours",
  "priority",
  "project",
  "state",
  "status",
]);

export class LabelRuleError extends Error {
  readonly code = "BAD_REQUEST" as const;
}

function validateName(name: string) {
  const normalized = name.trim();
  if (!normalized) throw new LabelRuleError("A Label name is required.");
  if (normalized.length > 80)
    throw new LabelRuleError("Label names may contain at most 80 characters.");
  if (reservedLabelNames.has(normalized.toLocaleLowerCase())) {
    throw new LabelRuleError(`“${normalized}” is a reserved Label name.`);
  }
  return normalized;
}

async function labelsForIds(executor: DbSession, workspaceId: string, ids: string[]) {
  if (ids.length === 0) return [] as LabelRow[];
  return executor
    .select()
    .from(schema.label)
    .where(and(eq(schema.label.workspaceId, workspaceId), inArray(schema.label.id, ids)));
}

async function labelTeamIdForSlug(executor: DbSession, workspaceId: string, teamSlug?: string) {
  if (teamSlug === undefined) return null;
  const [currentTeam] = await executor
    .select({ id: schema.team.id })
    .from(schema.team)
    .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
    .limit(1);
  return currentTeam?.id ?? null;
}

export type IssueLabelSummary = Pick<
  LabelRow,
  "id" | "teamId" | "parentId" | "isGroup" | "name" | "description" | "color" | "archivedAt"
>;

/** Labels attached to each requested Issue, including archived assignments. */
export async function listWorkspaceIssueLabelSummaries(
  executor: DbSession,
  workspaceId: string,
  issueIds: string[],
) {
  const result = new Map<string, IssueLabelSummary[]>();
  if (issueIds.length === 0) return result;

  const rows = await executor
    .select({
      issueId: schema.issueLabel.issueId,
      id: schema.label.id,
      teamId: schema.label.teamId,
      parentId: schema.label.parentId,
      isGroup: schema.label.isGroup,
      name: schema.label.name,
      description: schema.label.description,
      color: schema.label.color,
      archivedAt: schema.label.archivedAt,
    })
    .from(schema.issueLabel)
    .innerJoin(
      schema.label,
      and(
        eq(schema.label.id, schema.issueLabel.labelId),
        eq(schema.label.workspaceId, workspaceId),
      ),
    )
    .where(inArray(schema.issueLabel.issueId, issueIds))
    .orderBy(asc(schema.label.name));

  for (const row of rows) {
    const { issueId, ...labelSummary } = row;
    const labels = result.get(issueId) ?? [];
    labels.push(labelSummary);
    result.set(issueId, labels);
  }

  return result;
}

/** Workspace Labels, plus the selected Team's Labels when a Team slug is supplied. */
export async function listWorkspaceLabels(db: Db, workspaceId: string, teamSlug?: string) {
  const teamId = await labelTeamIdForSlug(db, workspaceId, teamSlug);
  if (teamSlug !== undefined && teamId === null) return null;

  const conditions = [eq(schema.label.workspaceId, workspaceId)];
  if (teamId === null) conditions.push(isNull(schema.label.teamId));
  else conditions.push(or(isNull(schema.label.teamId), eq(schema.label.teamId, teamId))!);

  const rows = await db
    .select()
    .from(schema.label)
    .where(and(...conditions))
    .orderBy(asc(schema.label.name));
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [countRows, lastAppliedRows] = await Promise.all([
    db
      .select({
        labelId: schema.issueLabel.labelId,
        issueCount: sql<number>`count(distinct ${schema.issue.id})::int`,
      })
      .from(schema.issueLabel)
      .innerJoin(schema.issue, eq(schema.issue.id, schema.issueLabel.issueId))
      .where(
        and(eq(schema.issue.workspaceId, workspaceId), inArray(schema.issueLabel.labelId, ids)),
      )
      .groupBy(schema.issueLabel.labelId),
    db
      .select({
        labelId: sql<string>`${schema.issueEvent.payload}->>'labelId'`,
        lastAppliedAt: max(schema.issueEvent.createdAt),
      })
      .from(schema.issueEvent)
      .where(
        and(
          eq(schema.issueEvent.workspaceId, workspaceId),
          eq(schema.issueEvent.type, "label_added"),
        ),
      )
      .groupBy(sql`${schema.issueEvent.payload}->>'labelId'`),
  ]);

  const counts = new Map(countRows.map((row) => [row.labelId, row.issueCount]));
  const lastApplied = new Map(lastAppliedRows.map((row) => [row.labelId, row.lastAppliedAt]));

  return rows.map((row) => ({
    ...row,
    issueCount: counts.get(row.id) ?? 0,
    lastAppliedAt: lastApplied.get(row.id) ?? null,
  }));
}

export async function createWorkspaceLabel(
  db: Db,
  workspaceId: string,
  values: {
    team?: string;
    parentId?: string;
    isGroup?: boolean;
    name: string;
    description?: string | null;
    color?: schema.LabelColor;
  },
) {
  return db.transaction(async (tx) => {
    const [requestedTeam] = values.team
      ? await tx
          .select({ id: schema.team.id })
          .from(schema.team)
          .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, values.team)))
          .limit(1)
      : [];
    if (values.team && !requestedTeam) return null;

    let parent: LabelRow | null = null;
    if (values.parentId) {
      if (values.isGroup) throw new LabelRuleError("A child Label cannot also be a group.");
      const [foundParent] = await tx
        .select()
        .from(schema.label)
        .where(and(eq(schema.label.id, values.parentId), eq(schema.label.workspaceId, workspaceId)))
        .limit(1)
        .for("update");
      if (!foundParent) throw new LabelRuleError("The parent Label group does not exist here.");
      if (!foundParent.isGroup || foundParent.parentId !== null) {
        throw new LabelRuleError("A Label can only be added to a top-level Label group.");
      }
      if (foundParent.archivedAt !== null) {
        throw new LabelRuleError("An archived Label group cannot receive new Labels.");
      }
      if (values.team !== undefined && requestedTeam?.id !== foundParent.teamId) {
        throw new LabelRuleError("The parent Label group belongs to a different scope.");
      }
      parent = foundParent;

      const [{ count } = { count: 0 }] = await tx
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.label)
        .where(eq(schema.label.parentId, parent.id));
      if (count >= 250) throw new LabelRuleError("A Label group can contain at most 250 Labels.");
    }

    const name = validateName(values.name);
    const [created] = await tx
      .insert(schema.label)
      .values({
        workspaceId,
        teamId: parent ? parent.teamId : (requestedTeam?.id ?? null),
        parentId: parent?.id ?? null,
        isGroup: values.parentId ? false : (values.isGroup ?? false),
        name,
        description: values.description?.trim() || null,
        color: values.color ?? "grey",
      })
      .returning();
    return created ?? null;
  });
}

export async function updateWorkspaceLabel(
  db: Db,
  workspaceId: string,
  id: string,
  values: LabelValues,
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(schema.label)
      .where(eq(schema.label.id, id))
      .limit(1)
      .for("update");
    if (!current || current.workspaceId !== workspaceId) return null;

    const changes = { ...values };
    if (changes.name !== undefined) changes.name = validateName(changes.name);
    if (changes.description !== undefined)
      changes.description = changes.description?.trim() || null;

    const [updated] = await tx
      .update(schema.label)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(schema.label.id, current.id))
      .returning();
    return updated ?? null;
  });
}

export async function archiveWorkspaceLabel(db: Db, workspaceId: string, id: string) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(schema.label)
      .where(eq(schema.label.id, id))
      .limit(1)
      .for("update");
    if (!current || current.workspaceId !== workspaceId) return null;

    const ids = current.isGroup
      ? [
          current.id,
          ...(
            await tx
              .select({ id: schema.label.id })
              .from(schema.label)
              .where(eq(schema.label.parentId, current.id))
          ).map((row) => row.id),
        ]
      : [current.id];
    const archivedAt = current.archivedAt ?? new Date();
    await tx
      .update(schema.label)
      .set({ archivedAt, updatedAt: new Date() })
      .where(inArray(schema.label.id, ids));

    return { ...current, archivedAt };
  });
}

export async function deleteWorkspaceLabel(
  db: Db,
  workspaceId: string,
  actorId: string,
  id: string,
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(schema.label)
      .where(eq(schema.label.id, id))
      .limit(1)
      .for("update");
    if (!current || current.workspaceId !== workspaceId) return null;

    const ids = current.isGroup
      ? [
          current.id,
          ...(
            await tx
              .select({ id: schema.label.id })
              .from(schema.label)
              .where(eq(schema.label.parentId, current.id))
          ).map((row) => row.id),
        ]
      : [current.id];
    await tx
      .select({ id: schema.label.id })
      .from(schema.label)
      .where(inArray(schema.label.id, ids))
      .orderBy(asc(schema.label.id))
      .for("update");
    const [{ deletedIssueCount } = { deletedIssueCount: 0 }] = await tx
      .select({ deletedIssueCount: sql<number>`count(distinct ${schema.issue.id})::int` })
      .from(schema.issueLabel)
      .innerJoin(schema.issue, eq(schema.issue.id, schema.issueLabel.issueId))
      .where(
        and(eq(schema.issue.workspaceId, workspaceId), inArray(schema.issueLabel.labelId, ids)),
      );
    const assignments = await tx
      .select({
        issueId: schema.issueLabel.issueId,
        labelId: schema.label.id,
        labelName: schema.label.name,
      })
      .from(schema.issueLabel)
      .innerJoin(schema.label, eq(schema.label.id, schema.issueLabel.labelId))
      .innerJoin(schema.issue, eq(schema.issue.id, schema.issueLabel.issueId))
      .where(
        and(eq(schema.issue.workspaceId, workspaceId), inArray(schema.issueLabel.labelId, ids)),
      );
    if (assignments.length > 0) {
      await insertWorkspaceIssueEvents(
        tx,
        assignments.map((assignment) => ({
          workspaceId,
          issueId: assignment.issueId,
          actorId,
          type: "label_removed" as const,
          payload: { labelId: assignment.labelId, labelName: assignment.labelName, deleted: true },
        })),
      );
    }
    await tx.delete(schema.label).where(eq(schema.label.id, current.id));
    return { deletedIssueCount };
  });
}

export async function mergeWorkspaceLabels(
  db: Db,
  workspaceId: string,
  actorId: string,
  sourceId: string,
  targetId: string,
) {
  return db.transaction(async (tx) => {
    if (sourceId === targetId) throw new LabelRuleError("A Label cannot be merged into itself.");
    const locked = await tx
      .select()
      .from(schema.label)
      .where(inArray(schema.label.id, [sourceId, targetId]))
      .orderBy(asc(schema.label.id))
      .for("update");
    const source = locked.find((row) => row.id === sourceId);
    const target = locked.find((row) => row.id === targetId);
    if (
      !source ||
      !target ||
      source.workspaceId !== workspaceId ||
      target.workspaceId !== workspaceId
    ) {
      return null;
    }
    if (source.teamId !== target.teamId) {
      throw new LabelRuleError("Labels can only be merged within the same scope.");
    }
    if (source.isGroup || target.isGroup) {
      throw new LabelRuleError("Label groups cannot be merged; merge individual Labels instead.");
    }
    if (target.archivedAt !== null) {
      throw new LabelRuleError("An archived Label cannot be the merge target.");
    }

    const sourceAssignments = await tx
      .select({ issueId: schema.issueLabel.issueId })
      .from(schema.issueLabel)
      .innerJoin(schema.issue, eq(schema.issue.id, schema.issueLabel.issueId))
      .where(
        and(eq(schema.issue.workspaceId, workspaceId), eq(schema.issueLabel.labelId, source.id)),
      );
    const issueIds = sourceAssignments.map((row) => row.issueId);
    const conflictingAssignments =
      issueIds.length > 0 && target.parentId !== null
        ? await tx
            .select({
              issueId: schema.issueLabel.issueId,
              labelId: schema.label.id,
              labelName: schema.label.name,
            })
            .from(schema.issueLabel)
            .innerJoin(schema.label, eq(schema.label.id, schema.issueLabel.labelId))
            .where(
              and(
                inArray(schema.issueLabel.issueId, issueIds),
                eq(schema.label.parentId, target.parentId),
                ne(schema.label.id, target.id),
                ne(schema.label.id, source.id),
              ),
            )
        : [];

    if (conflictingAssignments.length > 0) {
      for (const row of conflictingAssignments) {
        await tx
          .delete(schema.issueLabel)
          .where(
            and(
              eq(schema.issueLabel.issueId, row.issueId),
              eq(schema.issueLabel.labelId, row.labelId),
            ),
          );
      }
      await insertWorkspaceIssueEvents(
        tx,
        conflictingAssignments.map((row) => ({
          workspaceId,
          issueId: row.issueId,
          actorId,
          type: "label_removed" as const,
          payload: { labelId: row.labelId, labelName: row.labelName, mergedInto: target.id },
        })),
      );
    }

    const targetAssignments =
      issueIds.length > 0
        ? await tx
            .select({ issueId: schema.issueLabel.issueId })
            .from(schema.issueLabel)
            .where(
              and(
                eq(schema.issueLabel.labelId, target.id),
                inArray(schema.issueLabel.issueId, issueIds),
              ),
            )
        : [];
    const targetIssueIds = new Set(targetAssignments.map((row) => row.issueId));

    if (issueIds.length > 0) {
      await tx
        .delete(schema.issueLabel)
        .where(
          and(
            eq(schema.issueLabel.labelId, source.id),
            inArray(schema.issueLabel.issueId, issueIds),
          ),
        );
      const addedIssueIds = issueIds.filter((issueId) => !targetIssueIds.has(issueId));
      if (addedIssueIds.length > 0) {
        await tx
          .insert(schema.issueLabel)
          .values(addedIssueIds.map((issueId) => ({ issueId, labelId: target.id })));
      }
      await insertWorkspaceIssueEvents(tx, [
        ...issueIds.map((issueId) => ({
          workspaceId,
          issueId,
          actorId,
          type: "label_removed" as const,
          payload: { labelId: source.id, labelName: source.name, mergedInto: target.id },
        })),
        ...addedIssueIds.map((issueId) => ({
          workspaceId,
          issueId,
          actorId,
          type: "label_added" as const,
          payload: { labelId: target.id, labelName: target.name, mergedFrom: source.id },
        })),
      ]);
    }

    await tx.delete(schema.label).where(eq(schema.label.id, source.id));
    const [updatedTarget] = await tx
      .update(schema.label)
      .set({ updatedAt: new Date() })
      .where(eq(schema.label.id, target.id))
      .returning();
    return updatedTarget ?? null;
  });
}

export async function convertWorkspaceLabelToGroup(
  db: Db,
  workspaceId: string,
  actorId: string,
  id: string,
  childName?: string,
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(schema.label)
      .where(eq(schema.label.id, id))
      .limit(1)
      .for("update");
    if (!current || current.workspaceId !== workspaceId) return null;
    if (current.parentId !== null) throw new LabelRuleError("A child Label cannot become a group.");
    if (current.isGroup) throw new LabelRuleError("This Label is already a group.");
    if (current.archivedAt !== null)
      throw new LabelRuleError("An archived Label cannot become a group.");

    const assignments = await tx
      .select({ issueId: schema.issueLabel.issueId })
      .from(schema.issueLabel)
      .innerJoin(schema.issue, eq(schema.issue.id, schema.issueLabel.issueId))
      .where(
        and(eq(schema.issue.workspaceId, workspaceId), eq(schema.issueLabel.labelId, current.id)),
      );
    if (assignments.length > 0 && childName === undefined) {
      throw new LabelRuleError(
        "Provide a child name to preserve the Label's existing assignments.",
      );
    }

    const [group] = await tx
      .update(schema.label)
      .set({ isGroup: true, updatedAt: new Date() })
      .where(eq(schema.label.id, current.id))
      .returning();
    if (!group) return null;
    if (childName === undefined) return [group];

    const [child] = await tx
      .insert(schema.label)
      .values({
        workspaceId,
        teamId: current.teamId,
        parentId: current.id,
        name: validateName(childName),
        description: current.description,
        color: current.color,
      })
      .returning();
    if (!child) return [group];

    if (assignments.length > 0) {
      const issueIds = assignments.map((row) => row.issueId);
      await tx
        .update(schema.issueLabel)
        .set({ labelId: child.id })
        .where(
          and(
            eq(schema.issueLabel.labelId, current.id),
            inArray(schema.issueLabel.issueId, issueIds),
          ),
        );
      await insertWorkspaceIssueEvents(
        tx,
        assignments.flatMap(({ issueId }) => [
          {
            workspaceId,
            issueId,
            actorId,
            type: "label_removed" as const,
            payload: { labelId: current.id, labelName: current.name, convertedTo: child.id },
          },
          {
            workspaceId,
            issueId,
            actorId,
            type: "label_added" as const,
            payload: { labelId: child.id, labelName: child.name, convertedFrom: current.id },
          },
        ]),
      );
    }

    return [group, child];
  });
}

export async function moveWorkspaceLabel(
  db: Db,
  workspaceId: string,
  id: string,
  targetTeamSlug: string | null,
) {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(schema.label)
      .where(eq(schema.label.id, id))
      .limit(1)
      .for("update");
    if (!current || current.workspaceId !== workspaceId) return null;

    const targetTeamId = await labelTeamIdForSlug(tx, workspaceId, targetTeamSlug ?? undefined);
    if (targetTeamSlug !== null && targetTeamId === null) return null;
    if (targetTeamId === current.teamId) return [current];

    const descendants = current.isGroup
      ? await tx
          .select({ id: schema.label.id })
          .from(schema.label)
          .where(eq(schema.label.parentId, current.id))
      : [];
    const ids = [current.id, ...descendants.map((row) => row.id)];
    await tx
      .select({ id: schema.label.id })
      .from(schema.label)
      .where(inArray(schema.label.id, ids))
      .orderBy(asc(schema.label.id))
      .for("update");
    const assignments = await tx
      .select({ teamId: schema.issue.teamId })
      .from(schema.issueLabel)
      .innerJoin(schema.issue, eq(schema.issue.id, schema.issueLabel.issueId))
      .where(
        and(eq(schema.issue.workspaceId, workspaceId), inArray(schema.issueLabel.labelId, ids)),
      );
    if (targetTeamId !== null && assignments.some((row) => row.teamId !== targetTeamId)) {
      throw new LabelRuleError("A Label assigned outside the target Team cannot be moved into it.");
    }

    await tx
      .update(schema.label)
      .set({ teamId: targetTeamId, updatedAt: new Date() })
      .where(inArray(schema.label.id, ids));
    if (!current.isGroup && current.parentId !== null) {
      await tx
        .update(schema.label)
        .set({ parentId: null, updatedAt: new Date() })
        .where(eq(schema.label.id, current.id));
    }

    return tx.select().from(schema.label).where(inArray(schema.label.id, ids));
  });
}

export async function setWorkspaceIssueLabels(
  db: Db,
  workspaceId: string,
  actorId: string,
  issueId: string,
  labelIds: string[],
) {
  return db.transaction(async (tx) => {
    const [currentIssue] = await tx
      .select({ id: schema.issue.id, teamId: schema.issue.teamId })
      .from(schema.issue)
      .where(and(eq(schema.issue.id, issueId), eq(schema.issue.workspaceId, workspaceId)))
      .limit(1)
      .for("update");
    if (!currentIssue) return null;

    const labels = labelIds.length
      ? await tx
          .select()
          .from(schema.label)
          .where(and(eq(schema.label.workspaceId, workspaceId), inArray(schema.label.id, labelIds)))
          .orderBy(asc(schema.label.id))
          .for("update")
      : [];
    if (labels.length !== labelIds.length) {
      throw new LabelRuleError("One or more Labels do not belong to this Workspace.");
    }
    if (
      labels.some((current) => current.teamId !== null && current.teamId !== currentIssue.teamId)
    ) {
      throw new LabelRuleError("A Label must belong to the Issue's Team or Workspace.");
    }
    if (labels.some((current) => current.isGroup)) {
      throw new LabelRuleError("A Label group cannot be applied to an Issue.");
    }

    const childrenByGroup = new Set<string>();
    for (const current of labels) {
      if (current.parentId === null) continue;
      if (childrenByGroup.has(current.parentId)) {
        throw new LabelRuleError("An Issue can have only one Label from each group.");
      }
      childrenByGroup.add(current.parentId);
    }

    const currentAssignments = await tx
      .select({ labelId: schema.issueLabel.labelId })
      .from(schema.issueLabel)
      .where(eq(schema.issueLabel.issueId, currentIssue.id));
    const previousIds = new Set(currentAssignments.map((row) => row.labelId));
    const nextIds = new Set(labelIds);
    const removedIds = [...previousIds].filter((labelId) => !nextIds.has(labelId));
    const addedIds = [...nextIds].filter((labelId) => !previousIds.has(labelId));

    const newlyAppliedLabels = labels.filter((current) => addedIds.includes(current.id));
    if (newlyAppliedLabels.some((current) => current.archivedAt !== null)) {
      throw new LabelRuleError("Archived Labels cannot be newly applied to an Issue.");
    }

    const changedLabelDetails = await labelsForIds(tx, workspaceId, removedIds);
    if (removedIds.length > 0) {
      await tx
        .delete(schema.issueLabel)
        .where(
          and(
            eq(schema.issueLabel.issueId, currentIssue.id),
            inArray(schema.issueLabel.labelId, removedIds),
          ),
        );
    }
    if (addedIds.length > 0) {
      await tx
        .insert(schema.issueLabel)
        .values(addedIds.map((labelId) => ({ issueId: currentIssue.id, labelId })));
    }
    if (removedIds.length + addedIds.length > 0) {
      await insertWorkspaceIssueEvents(tx, [
        ...changedLabelDetails.map((current) => ({
          workspaceId,
          issueId: currentIssue.id,
          actorId,
          type: "label_removed" as const,
          payload: { labelId: current.id, labelName: current.name },
        })),
        ...newlyAppliedLabels.map((current) => ({
          workspaceId,
          issueId: currentIssue.id,
          actorId,
          type: "label_added" as const,
          payload: { labelId: current.id, labelName: current.name },
        })),
      ]);
    }

    const orderedLabels = labelIds.flatMap((labelId) => {
      const current = labels.find((row) => row.id === labelId);
      return current ? [current] : [];
    });
    return orderedLabels.map(
      ({ id, teamId, parentId, isGroup, name, description, color, archivedAt }) => ({
        id,
        teamId,
        parentId,
        isGroup,
        name,
        description,
        color,
        archivedAt,
      }),
    );
  });
}
