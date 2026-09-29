import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Db } from "./index";
import * as schema from "./schema";

type DbSession = Pick<Db, "delete" | "insert" | "select" | "update">;

export type IssueCreateValues = Pick<
  typeof schema.issue.$inferInsert,
  "title" | "description" | "priority" | "assigneeId" | "dueDate"
> & { statusId?: string };

export type IssueUpdateValues = Partial<
  Pick<
    typeof schema.issue.$inferInsert,
    "title" | "description" | "statusId" | "priority" | "assigneeId" | "dueDate"
  >
> & { teamId?: string };

export type IssueView = "active" | "backlog" | "all";

export class IssueRuleError extends Error {
  readonly code = "BAD_REQUEST" as const;
}

export class IssueConflictError extends Error {
  readonly code = "CONFLICT" as const;
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

function issueRows(executor: DbSession) {
  const assignee = alias(schema.member, "issue_assignee");
  const creator = alias(schema.member, "issue_creator");

  return executor
    .select({
      id: schema.issue.id,
      teamId: schema.issue.teamId,
      number: schema.issue.number,
      title: schema.issue.title,
      description: schema.issue.description,
      statusId: schema.issue.statusId,
      priority: schema.issue.priority,
      assigneeId: schema.issue.assigneeId,
      creatorId: schema.issue.creatorId,
      dueDate: schema.issue.dueDate,
      startedAt: schema.issue.startedAt,
      completedAt: schema.issue.completedAt,
      canceledAt: schema.issue.canceledAt,
      sortOrder: schema.issue.sortOrder,
      createdAt: schema.issue.createdAt,
      updatedAt: schema.issue.updatedAt,
      team: {
        id: schema.team.id,
        name: schema.team.name,
        slug: schema.team.slug,
        key: schema.team.key,
      },
      status: {
        id: schema.workflowStatus.id,
        name: schema.workflowStatus.name,
        category: schema.workflowStatus.category,
        color: schema.workflowStatus.color,
      },
      assignee: { id: assignee.id, name: assignee.name },
      creator: { id: creator.id, name: creator.name },
    })
    .from(schema.issue)
    .innerJoin(
      schema.team,
      and(
        eq(schema.team.id, schema.issue.teamId),
        eq(schema.team.workspaceId, schema.issue.workspaceId),
      ),
    )
    .innerJoin(
      schema.workflowStatus,
      and(
        eq(schema.workflowStatus.id, schema.issue.statusId),
        eq(schema.workflowStatus.teamId, schema.issue.teamId),
      ),
    )
    .leftJoin(
      assignee,
      and(
        eq(assignee.id, schema.issue.assigneeId),
        eq(assignee.workspaceId, schema.issue.workspaceId),
      ),
    )
    .innerJoin(
      creator,
      and(
        eq(creator.id, schema.issue.creatorId),
        eq(creator.workspaceId, schema.issue.workspaceId),
      ),
    );
}

function withIdentifier<T extends { team: { key: string }; number: number }>(issue: T) {
  return { ...issue, identifier: `${issue.team.key}-${issue.number}` };
}

function getStatusTimes(
  category: schema.WorkflowStatusCategory,
  previousCategory: schema.WorkflowStatusCategory | null,
  previousTimes: {
    startedAt: Date | null;
    completedAt: Date | null;
    canceledAt: Date | null;
  },
  now: Date,
) {
  let startedAt = previousTimes.startedAt;
  let completedAt = previousTimes.completedAt;
  let canceledAt = previousTimes.canceledAt;

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

async function insertIssueEvent(
  executor: DbSession,
  event: {
    workspaceId: string;
    issueId: string;
    actorId: string;
    type: schema.IssueEventType;
    payload: schema.IssueEventPayload;
    createdAt?: Date;
  },
) {
  await executor.insert(schema.issueEvent).values(event);
}

async function getIssueRow(executor: DbSession, workspaceId: string, id: string) {
  const [currentIssue] = await issueRows(executor)
    .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
    .limit(1);

  return currentIssue ? withIdentifier(currentIssue) : null;
}

export async function listWorkspaceTeamIssues(
  db: Db,
  workspaceId: string,
  teamSlug: string,
  view: IssueView = "active",
) {
  const [currentTeam] = await db
    .select({ id: schema.team.id })
    .from(schema.team)
    .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
    .limit(1);

  if (!currentTeam) return null;

  const conditions = [
    eq(schema.issue.workspaceId, workspaceId),
    eq(schema.issue.teamId, currentTeam.id),
  ];
  if (view === "active") {
    conditions.push(inArray(schema.workflowStatus.category, ["unstarted", "started"]));
  } else if (view === "backlog") {
    conditions.push(eq(schema.workflowStatus.category, "backlog"));
  } else {
    conditions.push(ne(schema.workflowStatus.category, "triage"));
  }

  const rows = await issueRows(db)
    .where(and(...conditions))
    .orderBy(
      categoryOrder,
      asc(schema.workflowStatus.position),
      asc(schema.issue.sortOrder),
      desc(schema.issue.number),
    );

  return rows.map(withIdentifier);
}

export async function getWorkspaceIssueByIdentifier(
  db: Db,
  workspaceId: string,
  identifier: string,
) {
  const match = /^([A-Z][A-Z0-9]*)-([1-9]\d*)$/i.exec(identifier.trim());
  if (!match) return null;

  const number = Number(match[2]);
  if (!Number.isSafeInteger(number)) return null;

  const [currentTeam] = await db
    .select({ id: schema.team.id })
    .from(schema.team)
    .where(
      and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.key, match[1]!.toUpperCase())),
    )
    .limit(1);

  if (!currentTeam) return null;

  const [currentIssue] = await issueRows(db)
    .where(
      and(
        eq(schema.issue.workspaceId, workspaceId),
        eq(schema.issue.teamId, currentTeam.id),
        eq(schema.issue.number, number),
      ),
    )
    .limit(1);

  return currentIssue ? withIdentifier(currentIssue) : null;
}

export async function createWorkspaceIssue(
  db: Db,
  workspaceId: string,
  actorId: string,
  teamSlug: string,
  values: IssueCreateValues,
) {
  return db.transaction(async (tx) => {
    const [currentTeam] = await tx
      .select()
      .from(schema.team)
      .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
      .limit(1);

    if (!currentTeam) return null;

    const statusId = values.statusId ?? currentTeam.defaultStatusId;
    if (!statusId) throw new IssueRuleError("The Team has no default Status.");

    const [currentStatus] = await tx
      .select()
      .from(schema.workflowStatus)
      .where(
        and(
          eq(schema.workflowStatus.id, statusId),
          eq(schema.workflowStatus.teamId, currentTeam.id),
        ),
      )
      .limit(1)
      .for("share");

    if (!currentStatus) {
      throw new IssueRuleError("The Status must belong to the selected Team.");
    }

    if (values.assigneeId) {
      const [assignee] = await tx
        .select({ id: schema.member.id })
        .from(schema.member)
        .where(
          and(eq(schema.member.id, values.assigneeId), eq(schema.member.workspaceId, workspaceId)),
        )
        .limit(1);
      if (!assignee) throw new IssueRuleError("The Assignee must belong to the current Workspace.");
    }

    const [allocatedTeam] = await tx
      .update(schema.team)
      .set({ issueCounter: sql`${schema.team.issueCounter} + 1` })
      .where(and(eq(schema.team.id, currentTeam.id), eq(schema.team.workspaceId, workspaceId)))
      .returning({
        id: schema.team.id,
        key: schema.team.key,
        issueCounter: schema.team.issueCounter,
      });

    if (!allocatedTeam) return null;

    const now = new Date();
    const statusTimes = getStatusTimes(
      currentStatus.category,
      null,
      { startedAt: null, completedAt: null, canceledAt: null },
      now,
    );
    const [createdIssue] = await tx
      .insert(schema.issue)
      .values({
        workspaceId,
        teamId: currentTeam.id,
        number: allocatedTeam.issueCounter,
        title: values.title,
        description: values.description ?? null,
        statusId: currentStatus.id,
        priority: values.priority ?? 0,
        assigneeId: values.assigneeId ?? null,
        creatorId: actorId,
        dueDate: values.dueDate ?? null,
        ...statusTimes,
      })
      .returning({ id: schema.issue.id });

    if (!createdIssue) return null;

    await insertIssueEvent(tx, {
      workspaceId,
      issueId: createdIssue.id,
      actorId,
      type: "created",
      payload: {
        identifier: `${allocatedTeam.key}-${allocatedTeam.issueCounter}`,
        title: values.title,
      },
      createdAt: now,
    });

    return getIssueRow(tx, workspaceId, createdIssue.id);
  });
}

export async function updateWorkspaceIssue(
  db: Db,
  workspaceId: string,
  actorId: string,
  id: string,
  values: IssueUpdateValues,
) {
  return db.transaction(async (tx) => {
    const initial = await getIssueRow(tx, workspaceId, id);
    if (!initial) return null;

    const targetTeamId = values.teamId ?? initial.teamId;
    const [targetTeam] = await tx
      .select()
      .from(schema.team)
      .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.id, targetTeamId)))
      .limit(1);
    if (!targetTeam) return null;

    const isMovingTeam = targetTeam.id !== initial.teamId;
    let targetStatus: typeof initial.status | undefined = initial.status;
    if (values.statusId !== undefined) {
      const [requestedStatus] = await tx
        .select()
        .from(schema.workflowStatus)
        .where(
          and(
            eq(schema.workflowStatus.id, values.statusId),
            eq(schema.workflowStatus.teamId, targetTeam.id),
          ),
        )
        .limit(1)
        .for("share");
      if (!requestedStatus) throw new IssueRuleError("The Status must belong to the Issue's Team.");
      targetStatus = requestedStatus;
    } else if (isMovingTeam) {
      const targetStatuses = await tx
        .select()
        .from(schema.workflowStatus)
        .where(eq(schema.workflowStatus.teamId, targetTeam.id))
        .orderBy(categoryOrder, asc(schema.workflowStatus.position))
        .for("share");
      targetStatus =
        targetStatuses.find(
          (status) =>
            status.name === initial.status.name && status.category === initial.status.category,
        ) ??
        targetStatuses.find((status) => status.name === initial.status.name) ??
        targetStatuses.find((status) => status.category === initial.status.category) ??
        targetStatuses.find((status) => status.id === targetTeam.defaultStatusId);
    }
    if (!targetStatus) throw new IssueRuleError("The target Team has no usable Status.");

    const needsStatusLock = isMovingTeam || values.statusId !== undefined;
    if (needsStatusLock && targetStatus.id !== initial.status.id) {
      const [sourceStatus] = await tx
        .select({ id: schema.workflowStatus.id })
        .from(schema.workflowStatus)
        .where(eq(schema.workflowStatus.id, initial.status.id))
        .limit(1)
        .for("share");
      if (!sourceStatus)
        throw new IssueConflictError("The Issue Status changed; retry the update.");
    }

    const [currentIssue] = await tx
      .select()
      .from(schema.issue)
      .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
      .limit(1)
      .for("update");
    if (!currentIssue) return null;

    if (currentIssue.teamId !== initial.teamId || currentIssue.statusId !== initial.statusId) {
      throw new IssueConflictError("The Issue changed while being updated; retry the update.");
    }

    if (values.assigneeId !== undefined && values.assigneeId !== null) {
      const [assignee] = await tx
        .select({ id: schema.member.id })
        .from(schema.member)
        .where(
          and(eq(schema.member.id, values.assigneeId), eq(schema.member.workspaceId, workspaceId)),
        )
        .limit(1);
      if (!assignee) throw new IssueRuleError("The Assignee must belong to the current Workspace.");
    }

    let allocatedNumber = currentIssue.number;
    let teamKey = initial.team.key;
    if (isMovingTeam) {
      const [allocatedTeam] = await tx
        .update(schema.team)
        .set({ issueCounter: sql`${schema.team.issueCounter} + 1` })
        .where(and(eq(schema.team.id, targetTeam.id), eq(schema.team.workspaceId, workspaceId)))
        .returning({ key: schema.team.key, issueCounter: schema.team.issueCounter });
      if (!allocatedTeam) return null;
      allocatedNumber = allocatedTeam.issueCounter;
      teamKey = allocatedTeam.key;
    }

    const nextTitle = values.title ?? currentIssue.title;
    const nextDescription =
      values.description !== undefined ? values.description : currentIssue.description;
    const nextPriority = values.priority ?? currentIssue.priority;
    const nextAssigneeId =
      values.assigneeId !== undefined ? values.assigneeId : currentIssue.assigneeId;
    const nextDueDate = values.dueDate !== undefined ? values.dueDate : currentIssue.dueDate;
    const nextStatus =
      values.statusId !== undefined || isMovingTeam ? targetStatus : initial.status;
    const statusChanged = nextStatus.id !== currentIssue.statusId;
    const teamChanged = isMovingTeam;
    const now = new Date();

    const patch: Partial<typeof schema.issue.$inferInsert> = {};
    const events: Array<{ type: schema.IssueEventType; payload: schema.IssueEventPayload }> = [];

    if (nextTitle !== currentIssue.title) {
      patch.title = nextTitle;
      events.push({ type: "title", payload: { from: currentIssue.title, to: nextTitle } });
    }
    if (nextDescription !== currentIssue.description) {
      patch.description = nextDescription;
      events.push({
        type: "description",
        payload: { from: currentIssue.description, to: nextDescription },
      });
    }
    if (nextPriority !== currentIssue.priority) {
      patch.priority = nextPriority;
      events.push({ type: "priority", payload: { from: currentIssue.priority, to: nextPriority } });
    }
    if (nextAssigneeId !== currentIssue.assigneeId) {
      patch.assigneeId = nextAssigneeId;
      events.push({
        type: "assignee",
        payload: { from: currentIssue.assigneeId, to: nextAssigneeId },
      });
    }
    if (nextDueDate !== currentIssue.dueDate) {
      patch.dueDate = nextDueDate;
      events.push({ type: "due_date", payload: { from: currentIssue.dueDate, to: nextDueDate } });
    }
    if (teamChanged) {
      patch.teamId = targetTeam.id;
      patch.number = allocatedNumber;
      patch.sortOrder = 0;
      events.push({
        type: "team",
        payload: {
          from: {
            id: initial.team.id,
            name: initial.team.name,
            key: initial.team.key,
            identifier: `${initial.team.key}-${currentIssue.number}`,
          },
          to: {
            id: targetTeam.id,
            name: targetTeam.name,
            key: teamKey,
            identifier: `${teamKey}-${allocatedNumber}`,
          },
        },
      });
    }
    if (statusChanged) {
      patch.statusId = nextStatus.id;
      Object.assign(
        patch,
        getStatusTimes(nextStatus.category, initial.status.category, currentIssue, now),
      );
      events.push({
        type: "status",
        payload: {
          from: {
            id: initial.status.id,
            name: initial.status.name,
            category: initial.status.category,
          },
          to: { id: nextStatus.id, name: nextStatus.name, category: nextStatus.category },
        },
      });
    }

    if (events.length === 0) return getIssueRow(tx, workspaceId, id);

    const [updatedIssue] = await tx
      .update(schema.issue)
      .set({ ...patch, updatedAt: now })
      .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
      .returning({ id: schema.issue.id });
    if (!updatedIssue) return null;

    let eventOffset = 0;
    for (const event of events) {
      await insertIssueEvent(tx, {
        workspaceId,
        issueId: id,
        actorId,
        ...event,
        createdAt: new Date(now.getTime() + eventOffset++),
      });
    }

    return getIssueRow(tx, workspaceId, id);
  });
}

export async function deleteWorkspaceIssue(db: Db, workspaceId: string, id: string) {
  const [deletedIssue] = await db
    .delete(schema.issue)
    .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
    .returning({ id: schema.issue.id });

  return deletedIssue ?? null;
}

export async function listWorkspaceIssueEvents(db: Db, workspaceId: string, id: string) {
  const [currentIssue] = await db
    .select({ id: schema.issue.id })
    .from(schema.issue)
    .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
    .limit(1);
  if (!currentIssue) return null;

  const actor = alias(schema.member, "issue_event_actor");
  return db
    .select({
      id: schema.issueEvent.id,
      issueId: schema.issueEvent.issueId,
      actorId: schema.issueEvent.actorId,
      actor: { id: actor.id, name: actor.name },
      type: schema.issueEvent.type,
      payload: schema.issueEvent.payload,
      createdAt: schema.issueEvent.createdAt,
    })
    .from(schema.issueEvent)
    .innerJoin(
      actor,
      and(
        eq(actor.id, schema.issueEvent.actorId),
        eq(actor.workspaceId, schema.issueEvent.workspaceId),
      ),
    )
    .where(and(eq(schema.issueEvent.issueId, id), eq(schema.issueEvent.workspaceId, workspaceId)))
    .orderBy(asc(schema.issueEvent.createdAt), asc(schema.issueEvent.id));
}

export type { IssuePriority, IssueEventType } from "./schema";
