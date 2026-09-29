import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "./index";
import * as schema from "./schema";

type DbSession = Pick<Db, "delete" | "insert" | "select" | "update">;

export type WorkflowStatusSeed = Pick<
  typeof schema.workflowStatus.$inferInsert,
  "name" | "category" | "color"
> & { description?: string | null };

export const DEFAULT_WORKFLOW_STATUSES: readonly WorkflowStatusSeed[] = [
  { name: "Backlog", category: "backlog", color: "grey" },
  { name: "Todo", category: "unstarted", color: "grey" },
  { name: "In Progress", category: "started", color: "amber" },
  {
    name: "In Review",
    description: "Pull request is being reviewed",
    category: "started",
    color: "green",
  },
  { name: "Done", category: "completed", color: "purple" },
  { name: "Canceled", category: "canceled", color: "slate" },
  { name: "Duplicate", category: "duplicate", color: "slate" },
];

export const VYZER_WORKFLOW_STATUSES = DEFAULT_WORKFLOW_STATUSES;

export const ZYNOX_WORKFLOW_STATUSES: readonly WorkflowStatusSeed[] = [
  { name: "Backlog", category: "backlog", color: "grey" },
  { name: "Ready", category: "unstarted", color: "purple" },
  { name: "Ready", category: "started", color: "slate" },
  { name: "In Progress", category: "started", color: "amber" },
  {
    name: "In Review",
    description: "Pull request is being reviewed",
    category: "started",
    color: "green",
  },
  { name: "Verifying", category: "started", color: "orange" },
  { name: "Blocked", category: "started", color: "red" },
  { name: "Done", category: "completed", color: "green" },
  { name: "Canceled", category: "canceled", color: "slate" },
  { name: "Duplicate", category: "duplicate", color: "slate" },
];

export class WorkflowStatusRuleError extends Error {
  readonly code = "BAD_REQUEST" as const;
}

const categoryOrder = sql<number>`case ${schema.workflowStatus.category}
  when 'triage' then 0
  when 'backlog' then 1
  when 'unstarted' then 2
  when 'started' then 3
  when 'completed' then 4
  when 'canceled' then 5
  when 'duplicate' then 6
  else 7
end`;

const defaultColor: Record<schema.WorkflowStatusCategory, schema.WorkflowStatusColor> = {
  triage: "grey",
  backlog: "grey",
  unstarted: "grey",
  started: "amber",
  completed: "green",
  canceled: "slate",
  duplicate: "slate",
};

export async function seedTeamWorkflowStatuses(
  executor: DbSession,
  teamId: string,
  statuses: readonly WorkflowStatusSeed[] = DEFAULT_WORKFLOW_STATUSES,
) {
  const positions = new Map<schema.WorkflowStatusCategory, number>();

  for (const status of statuses) {
    const position = positions.get(status.category) ?? 0;
    positions.set(status.category, position + 1);
    await executor
      .insert(schema.workflowStatus)
      .values({
        ...status,
        teamId,
        description: status.description ?? null,
        position,
      })
      .onConflictDoUpdate({
        target: [
          schema.workflowStatus.teamId,
          schema.workflowStatus.category,
          schema.workflowStatus.name,
        ],
        set: {
          description: status.description ?? null,
          color: status.color,
          position,
          updatedAt: new Date(),
        },
      });
  }

  const [backlogStatus] = await executor
    .select({ id: schema.workflowStatus.id })
    .from(schema.workflowStatus)
    .where(
      and(
        eq(schema.workflowStatus.teamId, teamId),
        eq(schema.workflowStatus.category, "backlog"),
        eq(schema.workflowStatus.name, "Backlog"),
      ),
    )
    .limit(1);

  if (!backlogStatus) throw new Error("The seeded Team workflow has no Backlog status.");

  await executor
    .update(schema.team)
    .set({ defaultStatusId: backlogStatus.id })
    .where(eq(schema.team.id, teamId));

  return backlogStatus;
}

export type WorkflowStatusListItem = typeof schema.workflowStatus.$inferSelect & {
  isDefault: boolean;
};

export async function listWorkspaceTeamWorkflowStatuses(
  db: Db,
  workspaceId: string,
  teamSlug: string,
): Promise<WorkflowStatusListItem[] | null> {
  const [currentTeam] = await db
    .select()
    .from(schema.team)
    .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
    .limit(1);

  if (!currentTeam) return null;

  const statuses = await db
    .select()
    .from(schema.workflowStatus)
    .where(eq(schema.workflowStatus.teamId, currentTeam.id))
    .orderBy(categoryOrder, asc(schema.workflowStatus.position), asc(schema.workflowStatus.name));

  return statuses.map((status) => ({
    ...status,
    isDefault: status.id === currentTeam.defaultStatusId,
  }));
}

export async function createWorkspaceTeamWorkflowStatus(
  db: Db,
  workspaceId: string,
  teamSlug: string,
  values: Pick<typeof schema.workflowStatus.$inferInsert, "name" | "category"> &
    Partial<Pick<typeof schema.workflowStatus.$inferInsert, "description" | "color">>,
) {
  return db.transaction(async (tx) => {
    const [currentTeam] = await tx
      .select()
      .from(schema.team)
      .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
      .limit(1)
      .for("update");

    if (!currentTeam) return null;
    if (values.category === "duplicate") {
      throw new WorkflowStatusRuleError("Duplicate is a fixed system Status.");
    }
    if (values.category === "triage") {
      throw new WorkflowStatusRuleError(
        "Triage Statuses require Triage to be enabled for the Team.",
      );
    }
    if (values.name.trim().toLowerCase() === "duplicate") {
      throw new WorkflowStatusRuleError("Duplicate is a reserved Status name.");
    }

    const categoryStatuses = await tx
      .select({ position: schema.workflowStatus.position })
      .from(schema.workflowStatus)
      .where(
        and(
          eq(schema.workflowStatus.teamId, currentTeam.id),
          eq(schema.workflowStatus.category, values.category),
        ),
      )
      .orderBy(asc(schema.workflowStatus.position));
    const position = (categoryStatuses.at(-1)?.position ?? -1) + 1;
    const [createdStatus] = await tx
      .insert(schema.workflowStatus)
      .values({
        ...values,
        teamId: currentTeam.id,
        description: values.description ?? null,
        color: values.color ?? defaultColor[values.category],
        position,
      })
      .returning();

    return createdStatus ? { ...createdStatus, isDefault: false } : null;
  });
}

export async function updateWorkspaceWorkflowStatus(
  db: Db,
  workspaceId: string,
  statusId: string,
  values: Partial<
    Pick<typeof schema.workflowStatus.$inferInsert, "name" | "description" | "color">
  >,
) {
  return db.transaction(async (tx) => {
    const [currentStatus] = await tx
      .select()
      .from(schema.workflowStatus)
      .where(eq(schema.workflowStatus.id, statusId))
      .limit(1)
      .for("update");

    if (!currentStatus) return null;

    const [currentTeam] = await tx
      .select()
      .from(schema.team)
      .where(
        and(eq(schema.team.id, currentStatus.teamId), eq(schema.team.workspaceId, workspaceId)),
      )
      .limit(1)
      .for("update");

    if (!currentTeam) return null;
    if (currentStatus.category === "duplicate" && values.name !== undefined) {
      throw new WorkflowStatusRuleError("Duplicate Status cannot be renamed.");
    }
    if (values.name?.trim().toLowerCase() === "duplicate") {
      throw new WorkflowStatusRuleError("Duplicate is a reserved Status name.");
    }

    const [updatedStatus] = await tx
      .update(schema.workflowStatus)
      .set({ ...values, updatedAt: new Date() })
      .where(eq(schema.workflowStatus.id, currentStatus.id))
      .returning();

    return updatedStatus
      ? { ...updatedStatus, isDefault: updatedStatus.id === currentTeam.defaultStatusId }
      : null;
  });
}

export async function deleteWorkspaceWorkflowStatus(
  db: Db,
  workspaceId: string,
  statusId: string,
  actorId: string,
  moveIssuesTo?: string,
) {
  return db.transaction(async (tx) => {
    const [currentStatus] = await tx
      .select()
      .from(schema.workflowStatus)
      .where(eq(schema.workflowStatus.id, statusId))
      .limit(1)
      .for("update");

    if (!currentStatus) return null;

    const [currentTeam] = await tx
      .select()
      .from(schema.team)
      .where(
        and(eq(schema.team.id, currentStatus.teamId), eq(schema.team.workspaceId, workspaceId)),
      )
      .limit(1)
      .for("update");

    if (!currentTeam) return null;
    if (currentStatus.category === "duplicate") {
      throw new WorkflowStatusRuleError("Duplicate Status cannot be deleted.");
    }

    const statuses = await tx
      .select()
      .from(schema.workflowStatus)
      .where(eq(schema.workflowStatus.teamId, currentTeam.id))
      .orderBy(categoryOrder, asc(schema.workflowStatus.position));
    const sameCategory = statuses.filter((status) => status.category === currentStatus.category);
    if (sameCategory.length <= 1) {
      throw new WorkflowStatusRuleError("Each workflow category must keep at least one Status.");
    }

    const affectedIssues = await tx
      .select({
        id: schema.issue.id,
        startedAt: schema.issue.startedAt,
        completedAt: schema.issue.completedAt,
        canceledAt: schema.issue.canceledAt,
      })
      .from(schema.issue)
      .where(
        and(
          eq(schema.issue.workspaceId, workspaceId),
          eq(schema.issue.teamId, currentTeam.id),
          eq(schema.issue.statusId, currentStatus.id),
        ),
      );

    let moveTarget: (typeof statuses)[number] | undefined;
    if (moveIssuesTo !== undefined) {
      moveTarget = statuses.find((status) => status.id === moveIssuesTo);
      if (!moveTarget || moveTarget.id === currentStatus.id) {
        throw new WorkflowStatusRuleError("Move target must be another Status in the same Team.");
      }
    }

    if (affectedIssues.length > 0 && !moveTarget) {
      throw new WorkflowStatusRuleError(
        "Choose a destination Status before deleting a Status with Issues.",
      );
    }

    if (moveTarget) {
      const now = new Date();
      for (const [offset, affectedIssue] of affectedIssues.entries()) {
        const statusTimes = statusTransitionTimes(
          moveTarget.category,
          currentStatus.category,
          affectedIssue,
          now,
        );
        await tx
          .update(schema.issue)
          .set({
            statusId: moveTarget.id,
            ...statusTimes,
            updatedAt: now,
          })
          .where(eq(schema.issue.id, affectedIssue.id));
        await tx.insert(schema.issueEvent).values({
          workspaceId,
          issueId: affectedIssue.id,
          actorId,
          type: "status",
          payload: {
            from: {
              id: currentStatus.id,
              name: currentStatus.name,
              category: currentStatus.category,
            },
            to: { id: moveTarget.id, name: moveTarget.name, category: moveTarget.category },
          },
          createdAt: new Date(now.getTime() + offset),
        });
      }
    }

    if (currentTeam.defaultStatusId === currentStatus.id) {
      const replacement = statuses.find(
        (status) =>
          status.id !== currentStatus.id &&
          (status.category === "backlog" || status.category === "unstarted"),
      );
      if (!replacement) {
        throw new WorkflowStatusRuleError("Set another default Status before deleting this one.");
      }
      await tx
        .update(schema.team)
        .set({ defaultStatusId: replacement.id, updatedAt: new Date() })
        .where(eq(schema.team.id, currentTeam.id));
    }

    await tx.delete(schema.workflowStatus).where(eq(schema.workflowStatus.id, currentStatus.id));
    for (const [position, status] of sameCategory
      .filter((current) => current.id !== currentStatus.id)
      .entries()) {
      await tx
        .update(schema.workflowStatus)
        .set({ position, updatedAt: new Date() })
        .where(eq(schema.workflowStatus.id, status.id));
    }

    return { id: currentStatus.id };
  });
}

function statusTransitionTimes(
  category: schema.WorkflowStatusCategory,
  previousCategory: schema.WorkflowStatusCategory,
  previousTimes: { startedAt: Date | null; completedAt: Date | null; canceledAt: Date | null },
  now: Date,
) {
  let { startedAt, completedAt, canceledAt } = previousTimes;

  if (category === "started") {
    if (previousCategory !== "started" || startedAt === null) startedAt = now;
    completedAt = null;
    canceledAt = null;
  } else if (category === "completed") {
    if (previousCategory !== "completed" || completedAt === null) completedAt = now;
    canceledAt = null;
  } else if (category === "canceled") {
    if (previousCategory !== "canceled" || canceledAt === null) canceledAt = now;
    completedAt = null;
  } else {
    completedAt = null;
    canceledAt = null;
  }

  return { startedAt, completedAt, canceledAt };
}

export async function reorderWorkspaceWorkflowStatus(
  db: Db,
  workspaceId: string,
  statusId: string,
  position: number,
) {
  return db.transaction(async (tx) => {
    const [currentStatus] = await tx
      .select()
      .from(schema.workflowStatus)
      .where(eq(schema.workflowStatus.id, statusId))
      .limit(1)
      .for("update");

    if (!currentStatus) return null;

    const [currentTeam] = await tx
      .select()
      .from(schema.team)
      .where(
        and(eq(schema.team.id, currentStatus.teamId), eq(schema.team.workspaceId, workspaceId)),
      )
      .limit(1)
      .for("update");

    if (!currentTeam) return null;

    const categoryStatuses = await tx
      .select()
      .from(schema.workflowStatus)
      .where(
        and(
          eq(schema.workflowStatus.teamId, currentTeam.id),
          eq(schema.workflowStatus.category, currentStatus.category),
        ),
      )
      .orderBy(asc(schema.workflowStatus.position), asc(schema.workflowStatus.name));

    if (position < 0 || position >= categoryStatuses.length) {
      throw new WorkflowStatusRuleError("Position must be within the Status category.");
    }

    const reordered = categoryStatuses.filter((status) => status.id !== currentStatus.id);
    reordered.splice(position, 0, currentStatus);
    for (const [nextPosition, status] of reordered.entries()) {
      await tx
        .update(schema.workflowStatus)
        .set({ position: nextPosition, updatedAt: new Date() })
        .where(eq(schema.workflowStatus.id, status.id));
    }

    return undefined;
  });
}

export async function setWorkspaceDefaultWorkflowStatus(
  db: Db,
  workspaceId: string,
  statusId: string,
) {
  return db.transaction(async (tx) => {
    const [currentStatus] = await tx
      .select()
      .from(schema.workflowStatus)
      .where(eq(schema.workflowStatus.id, statusId))
      .limit(1)
      .for("update");

    if (!currentStatus) return null;

    const [currentTeam] = await tx
      .select()
      .from(schema.team)
      .where(
        and(eq(schema.team.id, currentStatus.teamId), eq(schema.team.workspaceId, workspaceId)),
      )
      .limit(1)
      .for("update");

    if (!currentTeam) return null;
    if (currentStatus.category !== "backlog" && currentStatus.category !== "unstarted") {
      throw new WorkflowStatusRuleError("The default Status must be in Backlog or Unstarted.");
    }

    await tx
      .update(schema.team)
      .set({ defaultStatusId: currentStatus.id, updatedAt: new Date() })
      .where(eq(schema.team.id, currentTeam.id));
  });
}
