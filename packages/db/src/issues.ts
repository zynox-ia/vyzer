import { and, asc, desc, eq, gte, inArray, isNotNull, isNull, lte, ne, or, sql } from "drizzle-orm";
import { alias, type AnyPgColumn } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";
import { insertWorkspaceIssueEvent } from "./issue-events";
import { listWorkspaceIssueLabelSummaries } from "./labels";
import { listWorkspaceIssueRelationDetails } from "./relations";
import type { Db } from "./index";
import * as schema from "./schema";

type DbSession = Pick<Db, "delete" | "execute" | "insert" | "select" | "update">;

export type IssueCreateValues = Pick<
  typeof schema.issue.$inferInsert,
  "title" | "description" | "priority" | "assigneeId" | "dueDate" | "parentId"
> & { statusId?: string };

export type IssueUpdateValues = Partial<
  Pick<
    typeof schema.issue.$inferInsert,
    "title" | "description" | "statusId" | "priority" | "assigneeId" | "dueDate"
  >
> & { teamId?: string };

export type IssueView = "active" | "backlog" | "all";
export type IssueDateRange = { from?: string; to?: string; isEmpty?: boolean };
export type IssueDurationRange = { minSeconds?: number; maxSeconds?: number };
export type IssueFilters = {
  statusIds?: string[];
  assigneeIds?: string[];
  unassigned?: boolean;
  creatorIds?: string[];
  priorities?: schema.IssuePriority[];
  dueDate?: IssueDateRange;
  createdAt?: IssueDateRange;
  updatedAt?: IssueDateRange;
  startedAt?: IssueDateRange;
  completedAt?: IssueDateRange;
  labelIds?: string[];
  timeInStatus?: IssueDurationRange;
  content?: string;
};
export type IssueOrderBy =
  | "manual"
  | "title"
  | "status"
  | "priority"
  | "assignee"
  | "updated"
  | "created"
  | "dueDate"
  | "timeInStatus";
export type IssueGroupBy = "none" | "status" | "assignee" | "priority" | "label";
export type IssueListOptions = {
  view?: IssueView;
  filters?: IssueFilters;
  orderBy?: IssueOrderBy;
  orderDirection?: "asc" | "desc";
  groupBy?: IssueGroupBy;
  subgroupBy?: IssueGroupBy;
  orderCompletedByRecency?: boolean;
};

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
const priorityOrder = sql<number>`case ${schema.issue.priority}
  when 1 then 0
  when 2 then 1
  when 3 then 2
  when 4 then 3
  else 4
end`;
const issueAssignee = alias(schema.member, "issue_assignee");
const issueCreator = alias(schema.member, "issue_creator");

function issueRows(executor: DbSession) {
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
      parentId: schema.issue.parentId,
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
      assignee: { id: issueAssignee.id, name: issueAssignee.name },
      creator: { id: issueCreator.id, name: issueCreator.name },
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
      issueAssignee,
      and(
        eq(issueAssignee.id, schema.issue.assigneeId),
        eq(issueAssignee.workspaceId, schema.issue.workspaceId),
      ),
    )
    .innerJoin(
      issueCreator,
      and(
        eq(issueCreator.id, schema.issue.creatorId),
        eq(issueCreator.workspaceId, schema.issue.workspaceId),
      ),
    );
}

function withIdentifier<T extends { team: { key: string }; number: number }>(issue: T) {
  return { ...issue, identifier: `${issue.team.key}-${issue.number}` };
}

type IssueSubIssueProgress = { completed: number; total: number };

async function subIssueProgressByRootIds(
  executor: DbSession,
  workspaceId: string,
  rootIssueIds: string[],
) {
  if (rootIssueIds.length === 0) return new Map<string, IssueSubIssueProgress>();

  const rootIds = sql.join(
    rootIssueIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );
  const rows = await executor.execute<{
    rootId: string;
    completed: number;
    total: number;
  }>(sql`
    with recursive descendants(root_id, descendant_id, path) as (
      select parent_id, id, array[parent_id, id]
      from issue
      where workspace_id = ${workspaceId}::uuid and parent_id in (${rootIds})
      union all
      select descendants.root_id, child.id, descendants.path || child.id
      from issue as child
      inner join descendants on child.parent_id = descendants.descendant_id
      where child.workspace_id = ${workspaceId}::uuid
        and not (child.id = any(descendants.path))
    )
    select
      descendants.root_id as "rootId",
      count(*) filter (where status.category = 'completed')::int as completed,
      count(*)::int as total
    from descendants
    inner join issue as descendant_issue
      on descendant_issue.id = descendants.descendant_id
      and descendant_issue.workspace_id = ${workspaceId}::uuid
    inner join workflow_status as status
      on status.id = descendant_issue.status_id
      and status.team_id = descendant_issue.team_id
    group by descendants.root_id
  `);

  return new Map(rows.map((row) => [row.rootId, { completed: row.completed, total: row.total }]));
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
  await insertWorkspaceIssueEvent(executor, event);
}

async function getIssueRow(executor: DbSession, workspaceId: string, id: string) {
  const [currentIssue] = await issueRows(executor)
    .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
    .limit(1);

  if (!currentIssue) return null;
  const labelsByIssueId = await listWorkspaceIssueLabelSummaries(executor, workspaceId, [id]);
  return { ...withIdentifier(currentIssue), labels: labelsByIssueId.get(id) ?? [] };
}

type IssueFilterDimension = "status" | "assignee" | "creator" | "priority" | "label";

function addTimestampRange(conditions: SQL[], column: AnyPgColumn, range: IssueDateRange) {
  if (range.isEmpty !== undefined) {
    conditions.push(range.isEmpty ? isNull(column) : isNotNull(column));
  }
  if (range.from !== undefined) conditions.push(gte(column, new Date(range.from)));
  if (range.to !== undefined) conditions.push(lte(column, new Date(range.to)));
}

function currentStatusEnteredAt() {
  return sql`coalesce((
    select max(${schema.issueEvent.createdAt})
    from ${schema.issueEvent}
    where ${schema.issueEvent.issueId} = ${schema.issue.id}
      and ${schema.issueEvent.type} = 'status'
  ), ${schema.issue.createdAt})`;
}

function issueConditions(
  workspaceId: string,
  teamId: string,
  view: IssueView,
  filters: IssueFilters | undefined,
  ignoreDimension?: IssueFilterDimension,
) {
  const conditions: SQL[] = [
    eq(schema.issue.workspaceId, workspaceId),
    eq(schema.issue.teamId, teamId),
  ];

  if (view === "active") {
    conditions.push(inArray(schema.workflowStatus.category, ["unstarted", "started"]));
  } else if (view === "backlog") {
    conditions.push(eq(schema.workflowStatus.category, "backlog"));
  } else {
    conditions.push(ne(schema.workflowStatus.category, "triage"));
  }

  if (ignoreDimension !== "status" && filters?.statusIds) {
    conditions.push(inArray(schema.issue.statusId, filters.statusIds));
  }

  if (ignoreDimension !== "assignee") {
    const assigneeConditions: SQL[] = [];
    if (filters?.assigneeIds) {
      assigneeConditions.push(inArray(schema.issue.assigneeId, filters.assigneeIds));
    }
    if (filters?.unassigned) assigneeConditions.push(isNull(schema.issue.assigneeId));
    if (assigneeConditions.length === 1) conditions.push(assigneeConditions[0]!);
    else if (assigneeConditions.length > 1) conditions.push(or(...assigneeConditions)!);
  }

  if (ignoreDimension !== "creator" && filters?.creatorIds) {
    conditions.push(inArray(schema.issue.creatorId, filters.creatorIds));
  }
  if (ignoreDimension !== "priority" && filters?.priorities) {
    conditions.push(inArray(schema.issue.priority, filters.priorities));
  }
  if (ignoreDimension !== "label" && filters?.labelIds) {
    const labelIds = sql.join(
      filters.labelIds.map((labelId) => sql`${labelId}::uuid`),
      sql`, `,
    );
    conditions.push(sql`exists (
      select 1 from issue_label as filtered_issue_label
      inner join label as filtered_label on filtered_label.id = filtered_issue_label.label_id
      where filtered_issue_label.issue_id = ${schema.issue.id}
        and filtered_label.workspace_id = ${workspaceId}::uuid
        and filtered_issue_label.label_id in (${labelIds})
    )`);
  }
  if (filters?.dueDate) {
    const range = filters.dueDate;
    if (range.isEmpty !== undefined) {
      conditions.push(
        range.isEmpty ? isNull(schema.issue.dueDate) : isNotNull(schema.issue.dueDate),
      );
    }
    if (range.from !== undefined)
      conditions.push(sql`${schema.issue.dueDate} >= ${range.from}::date`);
    if (range.to !== undefined) conditions.push(sql`${schema.issue.dueDate} <= ${range.to}::date`);
  }
  if (filters?.createdAt) addTimestampRange(conditions, schema.issue.createdAt, filters.createdAt);
  if (filters?.updatedAt) addTimestampRange(conditions, schema.issue.updatedAt, filters.updatedAt);
  if (filters?.startedAt) addTimestampRange(conditions, schema.issue.startedAt, filters.startedAt);
  if (filters?.completedAt)
    addTimestampRange(conditions, schema.issue.completedAt, filters.completedAt);
  if (filters?.timeInStatus) {
    const timeInStatusSeconds = sql`extract(epoch from (now() - (${currentStatusEnteredAt()})))`;
    if (filters.timeInStatus.minSeconds !== undefined) {
      conditions.push(sql`${timeInStatusSeconds} >= ${filters.timeInStatus.minSeconds}`);
    }
    if (filters.timeInStatus.maxSeconds !== undefined) {
      conditions.push(sql`${timeInStatusSeconds} <= ${filters.timeInStatus.maxSeconds}`);
    }
  }
  if (filters?.content) {
    const content = filters.content.toLowerCase();
    conditions.push(sql`(
      strpos(lower(${schema.issue.title}), ${content}) > 0
      or strpos(lower(coalesce(${schema.issue.description}, '')), ${content}) > 0
    )`);
  }

  return conditions;
}

function groupOrderTerms(groupBy: IssueGroupBy | undefined) {
  switch (groupBy) {
    case "status":
      return [categoryOrder, asc(schema.workflowStatus.position)];
    case "assignee":
      return [sql`${issueAssignee.name} asc nulls last`];
    case "priority":
      return [asc(priorityOrder)];
    case "label":
      return [
        sql`coalesce((
        select min(lower(group_label.name))
        from issue_label as group_issue_label
        inner join label as group_label on group_label.id = group_issue_label.label_id
        where group_issue_label.issue_id = ${schema.issue.id}
          and group_label.workspace_id = ${schema.issue.workspaceId}
      ), 'zzzz') asc`,
      ];
    default:
      return [];
  }
}

type IssueOrderTerm = SQL | AnyPgColumn;

function issueOrderTerms(options: IssueListOptions): IssueOrderTerm[] {
  const orderBy = options.orderBy ?? "manual";
  const groupBy = options.groupBy ?? "status";
  const subgroupBy = options.subgroupBy ?? "none";
  const groupTerms: IssueOrderTerm[] = [];
  const seenGroups = new Set<IssueGroupBy>();

  for (const dimension of [groupBy, subgroupBy]) {
    if (dimension === "none" || seenGroups.has(dimension)) continue;
    seenGroups.add(dimension);
    groupTerms.push(...groupOrderTerms(dimension));
  }

  if (orderBy === "manual") {
    return [...groupTerms, asc(schema.issue.sortOrder), desc(schema.issue.number)];
  }

  const defaultDirection: "asc" | "desc" =
    orderBy === "updated" || orderBy === "created" || orderBy === "timeInStatus" ? "desc" : "asc";
  const direction = options.orderDirection ?? defaultDirection;
  const directed = (column: IssueOrderTerm) => (direction === "desc" ? desc(column) : asc(column));

  let primaryOrder: IssueOrderTerm;
  let secondaryOrder: IssueOrderTerm | undefined;
  switch (orderBy) {
    case "title":
      primaryOrder = directed(schema.issue.title);
      break;
    case "status":
      primaryOrder = directed(categoryOrder);
      secondaryOrder = directed(schema.workflowStatus.position);
      break;
    case "priority":
      primaryOrder = directed(priorityOrder);
      break;
    case "assignee":
      primaryOrder = sql`${issueAssignee.name} ${sql.raw(direction)} nulls last`;
      break;
    case "updated":
      primaryOrder = directed(schema.issue.updatedAt);
      break;
    case "created":
      primaryOrder = directed(schema.issue.createdAt);
      break;
    case "dueDate":
      primaryOrder = sql`${schema.issue.dueDate} ${sql.raw(direction)} nulls last`;
      break;
    case "timeInStatus": {
      const enteredAt = currentStatusEnteredAt();
      primaryOrder = direction === "desc" ? asc(enteredAt) : desc(enteredAt);
      break;
    }
  }

  return [
    ...groupTerms,
    primaryOrder,
    ...(secondaryOrder ? [secondaryOrder] : []),
    asc(schema.issue.sortOrder),
    desc(schema.issue.number),
  ];
}

function orderCompletedIssuesByRecency<
  T extends {
    status: { id: string; category: schema.WorkflowStatusCategory };
    assigneeId: string | null;
    priority: schema.IssuePriority;
    completedAt: Date | null;
    labels?: { id: string; name: string }[];
  },
>(rows: T[], options: IssueListOptions): T[] {
  if (!options.orderCompletedByRecency) return rows;

  const dimensions = [options.groupBy ?? "status", options.subgroupBy ?? "none"].filter(
    (dimension, index, all) => dimension !== "none" && all.indexOf(dimension) === index,
  );
  const completedSlotsByGroup = new Map<string, number[]>();

  rows.forEach((row, index) => {
    if (row.status.category !== "completed") return;

    const groupKey = JSON.stringify(
      dimensions.map((dimension) => {
        if (dimension === "status") return row.status.id;
        if (dimension === "assignee") return row.assigneeId;
        if (dimension === "priority") return row.priority;
        if (dimension === "label") return row.labels?.[0]?.name.toLocaleLowerCase() ?? null;
        return null;
      }),
    );
    const indexes = completedSlotsByGroup.get(groupKey) ?? [];
    indexes.push(index);
    completedSlotsByGroup.set(groupKey, indexes);
  });

  for (const indexes of completedSlotsByGroup.values()) {
    const completedRows = indexes.map((index) => rows[index]!);
    completedRows.sort((left, right) => {
      if (left.completedAt === null) return right.completedAt === null ? 0 : 1;
      if (right.completedAt === null) return -1;
      return right.completedAt.getTime() - left.completedAt.getTime();
    });
    indexes.forEach((index, offset) => {
      rows[index] = completedRows[offset]!;
    });
  }

  return rows;
}

export async function listWorkspaceTeamIssues(
  db: Db,
  workspaceId: string,
  teamSlug: string,
  options: IssueListOptions = {},
) {
  const [currentTeam] = await db
    .select({ id: schema.team.id })
    .from(schema.team)
    .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
    .limit(1);

  if (!currentTeam) return null;

  const conditions = issueConditions(
    workspaceId,
    currentTeam.id,
    options.view ?? "active",
    options.filters,
  );
  const rows = await issueRows(db)
    .where(and(...conditions))
    .orderBy(...issueOrderTerms(options));
  const progressByIssueId = await subIssueProgressByRootIds(
    db,
    workspaceId,
    rows.map((row) => row.id),
  );
  const labelsByIssueId = await listWorkspaceIssueLabelSummaries(
    db,
    workspaceId,
    rows.map((row) => row.id),
  );
  const rowsWithLabels = rows.map((row) => ({
    ...row,
    labels: labelsByIssueId.get(row.id) ?? [],
  }));

  return orderCompletedIssuesByRecency(rowsWithLabels, options).map((row) => ({
    ...withIdentifier(row),
    subIssueProgress: progressByIssueId.get(row.id) ?? { completed: 0, total: 0 },
  }));
}

export async function listWorkspaceTeamIssueFacets(
  db: Db,
  workspaceId: string,
  teamSlug: string,
  options: Pick<IssueListOptions, "view" | "filters"> = {},
) {
  const [currentTeam] = await db
    .select({ id: schema.team.id })
    .from(schema.team)
    .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
    .limit(1);

  if (!currentTeam) return null;

  const view = options.view ?? "active";
  const [
    statusRows,
    assigneeRows,
    creatorRows,
    priorityRows,
    labelRows,
    statuses,
    members,
    labels,
  ] = await Promise.all([
    db
      .select({ value: schema.issue.statusId, count: sql<number>`count(*)::int` })
      .from(schema.issue)
      .innerJoin(
        schema.workflowStatus,
        and(
          eq(schema.workflowStatus.id, schema.issue.statusId),
          eq(schema.workflowStatus.teamId, schema.issue.teamId),
        ),
      )
      .where(and(...issueConditions(workspaceId, currentTeam.id, view, options.filters, "status")))
      .groupBy(schema.issue.statusId),
    db
      .select({ value: schema.issue.assigneeId, count: sql<number>`count(*)::int` })
      .from(schema.issue)
      .innerJoin(
        schema.workflowStatus,
        and(
          eq(schema.workflowStatus.id, schema.issue.statusId),
          eq(schema.workflowStatus.teamId, schema.issue.teamId),
        ),
      )
      .where(
        and(...issueConditions(workspaceId, currentTeam.id, view, options.filters, "assignee")),
      )
      .groupBy(schema.issue.assigneeId),
    db
      .select({ value: schema.issue.creatorId, count: sql<number>`count(*)::int` })
      .from(schema.issue)
      .innerJoin(
        schema.workflowStatus,
        and(
          eq(schema.workflowStatus.id, schema.issue.statusId),
          eq(schema.workflowStatus.teamId, schema.issue.teamId),
        ),
      )
      .where(and(...issueConditions(workspaceId, currentTeam.id, view, options.filters, "creator")))
      .groupBy(schema.issue.creatorId),
    db
      .select({ value: schema.issue.priority, count: sql<number>`count(*)::int` })
      .from(schema.issue)
      .innerJoin(
        schema.workflowStatus,
        and(
          eq(schema.workflowStatus.id, schema.issue.statusId),
          eq(schema.workflowStatus.teamId, schema.issue.teamId),
        ),
      )
      .where(
        and(...issueConditions(workspaceId, currentTeam.id, view, options.filters, "priority")),
      )
      .groupBy(schema.issue.priority),
    db
      .select({
        value: schema.issueLabel.labelId,
        count: sql<number>`count(distinct ${schema.issue.id})::int`,
      })
      .from(schema.issueLabel)
      .innerJoin(schema.issue, eq(schema.issue.id, schema.issueLabel.issueId))
      .innerJoin(
        schema.workflowStatus,
        and(
          eq(schema.workflowStatus.id, schema.issue.statusId),
          eq(schema.workflowStatus.teamId, schema.issue.teamId),
        ),
      )
      .where(and(...issueConditions(workspaceId, currentTeam.id, view, options.filters, "label")))
      .groupBy(schema.issueLabel.labelId),
    db
      .select({
        id: schema.workflowStatus.id,
        name: schema.workflowStatus.name,
        description: schema.workflowStatus.description,
        category: schema.workflowStatus.category,
      })
      .from(schema.workflowStatus)
      .where(eq(schema.workflowStatus.teamId, currentTeam.id))
      .orderBy(categoryOrder, asc(schema.workflowStatus.position)),
    db
      .select({ id: schema.member.id, name: schema.member.name })
      .from(schema.member)
      .where(eq(schema.member.workspaceId, workspaceId))
      .orderBy(asc(schema.member.name)),
    db
      .select({
        id: schema.label.id,
        name: schema.label.name,
        color: schema.label.color,
      })
      .from(schema.label)
      .where(
        and(
          eq(schema.label.workspaceId, workspaceId),
          eq(schema.label.isGroup, false),
          or(isNull(schema.label.teamId), eq(schema.label.teamId, currentTeam.id)),
        ),
      )
      .orderBy(asc(schema.label.name)),
  ]);

  const statusCounts = new Map(statusRows.map((row) => [row.value, row.count]));
  const assigneeCounts = new Map(assigneeRows.map((row) => [row.value, row.count]));
  const creatorCounts = new Map(creatorRows.map((row) => [row.value, row.count]));
  const priorityCounts = new Map(priorityRows.map((row) => [row.value, row.count]));
  const labelCounts = new Map(labelRows.map((row) => [row.value, row.count]));

  return {
    status: statuses.map((status) => ({
      ...status,
      count: statusCounts.get(status.id) ?? 0,
    })),
    assignees: [
      ...members.map((currentMember) => ({
        ...currentMember,
        count: assigneeCounts.get(currentMember.id) ?? 0,
      })),
      { id: null, name: null, count: assigneeCounts.get(null) ?? 0 },
    ],
    creators: members.map((currentMember) => ({
      ...currentMember,
      count: creatorCounts.get(currentMember.id) ?? 0,
    })),
    priority: ([0, 1, 2, 3, 4] as const).map((value) => ({
      value,
      count: priorityCounts.get(value) ?? 0,
    })),
    labels: labels.map((currentLabel) => ({
      ...currentLabel,
      count: labelCounts.get(currentLabel.id) ?? 0,
    })),
  };
}

export async function reorderWorkspaceIssue(
  db: Db,
  workspaceId: string,
  id: string,
  position: number,
  options: Pick<IssueListOptions, "groupBy" | "subgroupBy"> = {},
) {
  return db.transaction(async (tx) => {
    const [initialIssue] = await tx
      .select({ teamId: schema.issue.teamId })
      .from(schema.issue)
      .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
      .limit(1);

    if (!initialIssue) return null;

    // Reorders in a Team take this lock before any Issue locks, preventing sibling-row deadlocks.
    const [lockedTeam] = await tx
      .select({ id: schema.team.id })
      .from(schema.team)
      .where(and(eq(schema.team.id, initialIssue.teamId), eq(schema.team.workspaceId, workspaceId)))
      .limit(1)
      .for("update");

    if (!lockedTeam) return null;

    const teamIssues = await tx
      .select({
        id: schema.issue.id,
        statusId: schema.issue.statusId,
        assigneeId: schema.issue.assigneeId,
        priority: schema.issue.priority,
      })
      .from(schema.issue)
      .where(
        and(
          eq(schema.issue.workspaceId, workspaceId),
          eq(schema.issue.teamId, initialIssue.teamId),
        ),
      )
      .orderBy(asc(schema.issue.sortOrder), desc(schema.issue.number))
      .for("update");

    const currentIssue = teamIssues.find((row) => row.id === id);
    if (!currentIssue) {
      const [movedIssue] = await tx
        .select({ id: schema.issue.id })
        .from(schema.issue)
        .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
        .limit(1);

      if (movedIssue)
        throw new IssueConflictError("The Issue moved to another Team; retry the reorder.");
      return null;
    }

    const dimensions = [options.groupBy ?? "status", options.subgroupBy ?? "none"].filter(
      (dimension, index, all) => dimension !== "none" && all.indexOf(dimension) === index,
    );
    const labelGroupByIssue = new Map<string, string>();
    if (dimensions.includes("label")) {
      const issueLabelRows = await tx
        .select({ issueId: schema.issueLabel.issueId, name: schema.label.name })
        .from(schema.issueLabel)
        .innerJoin(schema.label, eq(schema.label.id, schema.issueLabel.labelId))
        .where(
          inArray(
            schema.issueLabel.issueId,
            teamIssues.map((row) => row.id),
          ),
        )
        .orderBy(asc(schema.label.name), asc(schema.label.id));
      for (const row of issueLabelRows) {
        if (!labelGroupByIssue.has(row.issueId)) {
          labelGroupByIssue.set(row.issueId, row.name.toLocaleLowerCase());
        }
      }
    }
    const keyFor = (issue: (typeof teamIssues)[number]) =>
      JSON.stringify(
        dimensions.map((dimension) => {
          if (dimension === "status") return issue.statusId;
          if (dimension === "assignee") return issue.assigneeId;
          if (dimension === "priority") return issue.priority;
          if (dimension === "label") return labelGroupByIssue.get(issue.id) ?? null;
          return null;
        }),
      );
    const targetGroupKey = keyFor(currentIssue);
    const groupSlots: number[] = [];
    const groupIds: string[] = [];
    teamIssues.forEach((teamIssue, index) => {
      if (keyFor(teamIssue) !== targetGroupKey) return;
      groupSlots.push(index);
      groupIds.push(teamIssue.id);
    });

    const currentIndex = groupIds.indexOf(id);
    if (currentIndex < 0) return null;
    groupIds.splice(currentIndex, 1);
    groupIds.splice(Math.min(position, groupIds.length), 0, id);

    const groupSlotSet = new Set(groupSlots);
    let groupOffset = 0;
    const orderedIds = teamIssues.map((teamIssue, index) =>
      groupSlotSet.has(index) ? groupIds[groupOffset++]! : teamIssue.id,
    );

    for (const [nextPosition, issueId] of orderedIds.entries()) {
      await tx
        .update(schema.issue)
        .set({ sortOrder: nextPosition })
        .where(and(eq(schema.issue.id, issueId), eq(schema.issue.workspaceId, workspaceId)));
    }

    return { id };
  });
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

  if (!currentIssue) return null;
  const labelsByIssueId = await listWorkspaceIssueLabelSummaries(db, workspaceId, [
    currentIssue.id,
  ]);
  const relationDetails = await listWorkspaceIssueRelationDetails(db, workspaceId, currentIssue.id);

  const parentIssue = currentIssue.parentId
    ? await issueRows(db)
        .where(
          and(
            eq(schema.issue.id, currentIssue.parentId),
            eq(schema.issue.workspaceId, workspaceId),
          ),
        )
        .limit(1)
        .then(([parent]) => parent)
    : null;
  const progressByIssueId = await subIssueProgressByRootIds(db, workspaceId, [currentIssue.id]);

  return {
    ...withIdentifier(currentIssue),
    labels: labelsByIssueId.get(currentIssue.id) ?? [],
    relations: relationDetails.relations,
    links: relationDetails.links,
    parent: parentIssue
      ? {
          id: parentIssue.id,
          identifier: `${parentIssue.team.key}-${parentIssue.number}`,
          title: parentIssue.title,
        }
      : null,
    subIssueProgress: progressByIssueId.get(currentIssue.id) ?? { completed: 0, total: 0 },
  };
}

export async function createWorkspaceIssue(
  db: Db,
  workspaceId: string,
  actorId: string,
  teamSlug: string | undefined,
  values: IssueCreateValues,
) {
  return db.transaction(async (tx) => {
    let parentIssue: Pick<
      typeof schema.issue.$inferSelect,
      "id" | "teamId" | "priority" | "assigneeId"
    > | null = null;
    let currentTeam: typeof schema.team.$inferSelect | undefined;

    if (values.parentId) {
      await tx
        .select({ id: schema.workspace.id })
        .from(schema.workspace)
        .where(eq(schema.workspace.id, workspaceId))
        .for("update");

      const [matchedParent] = await tx
        .select({
          id: schema.issue.id,
          teamId: schema.issue.teamId,
          priority: schema.issue.priority,
          assigneeId: schema.issue.assigneeId,
        })
        .from(schema.issue)
        .where(and(eq(schema.issue.id, values.parentId), eq(schema.issue.workspaceId, workspaceId)))
        .limit(1)
        .for("update");

      if (!matchedParent) {
        throw new IssueRuleError("The parent Issue must belong to the current Workspace.");
      }
      parentIssue = matchedParent;

      [currentTeam] = await tx
        .select()
        .from(schema.team)
        .where(
          and(eq(schema.team.id, matchedParent.teamId), eq(schema.team.workspaceId, workspaceId)),
        )
        .limit(1);
      if (!currentTeam) return null;

      if (teamSlug !== undefined && teamSlug !== currentTeam.slug) {
        throw new IssueRuleError("A sub-issue inherits its parent's Team.");
      }
    } else if (teamSlug !== undefined) {
      [currentTeam] = await tx
        .select()
        .from(schema.team)
        .where(and(eq(schema.team.workspaceId, workspaceId), eq(schema.team.slug, teamSlug)))
        .limit(1);
    }

    if (!currentTeam) return null;

    let inheritedAssigneeId: string | null = null;
    if (parentIssue?.assigneeId) {
      const existingSubIssues = await tx
        .select({ assigneeId: schema.issue.assigneeId })
        .from(schema.issue)
        .where(
          and(eq(schema.issue.workspaceId, workspaceId), eq(schema.issue.parentId, parentIssue.id)),
        );
      const allExistingSubIssuesShareParentAssignee = existingSubIssues.every(
        (subIssue) => subIssue.assigneeId === parentIssue.assigneeId,
      );

      if (actorId === parentIssue.assigneeId || allExistingSubIssuesShareParentAssignee) {
        inheritedAssigneeId = parentIssue.assigneeId;
      }
    }

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
        priority: values.priority ?? parentIssue?.priority ?? 0,
        assigneeId: values.assigneeId !== undefined ? values.assigneeId : inheritedAssigneeId,
        creatorId: actorId,
        parentId: parentIssue?.id ?? null,
        dueDate: values.dueDate ?? null,
        createdAt: now,
        updatedAt: now,
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

    const assignedLabels = isMovingTeam
      ? await tx
          .select({
            id: schema.label.id,
            name: schema.label.name,
            teamId: schema.label.teamId,
          })
          .from(schema.issueLabel)
          .innerJoin(schema.label, eq(schema.label.id, schema.issueLabel.labelId))
          .where(eq(schema.issueLabel.issueId, currentIssue.id))
          .orderBy(asc(schema.label.id))
          .for("update")
      : [];
    const labelsToRemove = assignedLabels.filter(
      (currentLabel) => currentLabel.teamId !== null && currentLabel.teamId !== targetTeam.id,
    );

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
      if (labelsToRemove.length > 0) {
        const labelIds = labelsToRemove.map((currentLabel) => currentLabel.id);
        await tx
          .delete(schema.issueLabel)
          .where(
            and(
              eq(schema.issueLabel.issueId, currentIssue.id),
              inArray(schema.issueLabel.labelId, labelIds),
            ),
          );
        events.push(
          ...labelsToRemove.map((currentLabel) => ({
            type: "label_removed" as const,
            payload: { labelId: currentLabel.id, labelName: currentLabel.name, teamMove: true },
          })),
        );
      }
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
  return db.transaction(async (tx) => {
    await tx
      .select({ id: schema.workspace.id })
      .from(schema.workspace)
      .where(eq(schema.workspace.id, workspaceId))
      .for("update");

    const [deletedIssue] = await tx
      .delete(schema.issue)
      .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
      .returning({ id: schema.issue.id });

    return deletedIssue ?? null;
  });
}

export async function setWorkspaceIssueParent(
  db: Db,
  workspaceId: string,
  id: string,
  parentId: string | null,
) {
  return db.transaction(async (tx) => {
    await tx
      .select({ id: schema.workspace.id })
      .from(schema.workspace)
      .where(eq(schema.workspace.id, workspaceId))
      .for("update");

    const [currentIssue] = await tx
      .select({ id: schema.issue.id, parentId: schema.issue.parentId })
      .from(schema.issue)
      .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)))
      .limit(1)
      .for("update");
    if (!currentIssue) return null;
    if (currentIssue.parentId === parentId) return getIssueRow(tx, workspaceId, id);
    if (parentId === null) {
      await tx
        .update(schema.issue)
        .set({ parentId: null, updatedAt: new Date() })
        .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)));
      return getIssueRow(tx, workspaceId, id);
    }
    if (parentId === id) throw new IssueRuleError("An Issue cannot be its own parent.");

    const [parentIssue] = await tx
      .select({ id: schema.issue.id })
      .from(schema.issue)
      .where(and(eq(schema.issue.id, parentId), eq(schema.issue.workspaceId, workspaceId)))
      .limit(1)
      .for("update");
    if (!parentIssue) {
      throw new IssueRuleError("The parent Issue must belong to the current Workspace.");
    }

    const ancestors = await tx.execute<{ id: string }>(sql`
      with recursive ancestors(id, parent_id) as (
        select id, parent_id
        from issue
        where id = ${parentId}::uuid and workspace_id = ${workspaceId}::uuid
        union
        select parent.id, parent.parent_id
        from issue as parent
        inner join ancestors on parent.id = ancestors.parent_id
        where parent.workspace_id = ${workspaceId}::uuid
      )
      select id from ancestors
    `);
    if (ancestors.some((ancestor) => ancestor.id === id)) {
      throw new IssueRuleError("An Issue cannot be moved under one of its descendants.");
    }

    await tx
      .update(schema.issue)
      .set({ parentId, updatedAt: new Date() })
      .where(and(eq(schema.issue.id, id), eq(schema.issue.workspaceId, workspaceId)));

    return getIssueRow(tx, workspaceId, id);
  });
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
