import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNotNull,
  isNull,
  lt,
  notInArray,
  or,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Db } from "./index";
import * as schema from "./schema";

type DbSession = Pick<Db, "delete" | "execute" | "insert" | "select" | "update">;

export type NotificationListOptions = {
  unreadOnly?: boolean;
  priorityOnly?: boolean;
  otherOnly?: boolean;
  priorityAssignmentsEnabled?: boolean;
  order?: "newest" | "oldest";
  cursor?: { id: string; createdAt: Date };
  limit: number;
};

export type NotificationIssueEvent = Pick<
  typeof schema.issueEvent.$inferSelect,
  "id" | "workspaceId" | "issueId" | "actorId" | "type" | "payload" | "createdAt"
>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function payloadMemberId(value: unknown): string | null {
  return typeof value === "string" && UUID_PATTERN.test(value) ? value : null;
}

/**
 * Create assignment notifications inside the transaction that wrote the IssueEvent.
 * Status, priority, and blocking fan-out waits for Time B's issue_subscriber table (3.7).
 */
export async function notifyIssueEvent(
  tx: DbSession,
  event: NotificationIssueEvent,
): Promise<void> {
  if (event.type !== "assignee" || !event.actorId) return;

  const [currentIssue] = await tx
    .select({ id: schema.issue.id })
    .from(schema.issue)
    .where(and(eq(schema.issue.id, event.issueId), eq(schema.issue.workspaceId, event.workspaceId)))
    .limit(1);
  const [actor] = await tx
    .select({ id: schema.member.id })
    .from(schema.member)
    .where(
      and(eq(schema.member.id, event.actorId), eq(schema.member.workspaceId, event.workspaceId)),
    )
    .limit(1);

  if (!currentIssue || !actor) return;

  const previousAssigneeId = payloadMemberId(event.payload.from);
  const nextAssigneeId = payloadMemberId(event.payload.to);
  const candidates = [
    ...(nextAssigneeId && nextAssigneeId !== event.actorId
      ? [{ recipientId: nextAssigneeId, type: "assigned" as const }]
      : []),
    ...(previousAssigneeId && previousAssigneeId !== event.actorId
      ? [{ recipientId: previousAssigneeId, type: "unassigned" as const }]
      : []),
  ];
  const candidateIds = [...new Set(candidates.map(({ recipientId }) => recipientId))];
  if (candidateIds.length === 0) return;

  const workspaceMembers = await tx
    .select({ id: schema.member.id })
    .from(schema.member)
    .where(
      and(
        eq(schema.member.workspaceId, event.workspaceId),
        inArray(schema.member.id, candidateIds),
      ),
    );
  const validMemberIds = new Set(workspaceMembers.map(({ id }) => id));
  const notifications = candidates
    .filter(({ recipientId }) => validMemberIds.has(recipientId))
    .map(({ recipientId, type }) => ({
      workspaceId: event.workspaceId,
      recipientId,
      type,
      actorId: event.actorId,
      issueId: event.issueId,
      projectId: null,
      issueEventId: event.id,
      payload: event.payload,
      createdAt: event.createdAt,
      updatedAt: event.createdAt,
    }));

  if (notifications.length > 0) {
    await tx.insert(schema.notification).values(notifications).onConflictDoNothing();
  }
}

/** List active notifications for one Member in one Workspace. */
export async function listWorkspaceNotifications(
  db: DbSession,
  workspaceId: string,
  recipientId: string,
  options: NotificationListOptions,
) {
  const recipient = alias(schema.member, "notification_recipient");
  const actor = alias(schema.member, "notification_actor");
  const conditions = [
    eq(schema.notification.workspaceId, workspaceId),
    eq(schema.notification.recipientId, recipientId),
    eq(recipient.workspaceId, workspaceId),
    isNull(schema.notification.archivedAt),
  ];

  if (options.unreadOnly) conditions.push(isNull(schema.notification.readAt));
  if (options.priorityOnly) {
    if (options.priorityAssignmentsEnabled) {
      conditions.push(inArray(schema.notification.type, ["assigned", "unassigned"]));
    } else {
      conditions.push(sql`false`);
    }
  }
  if (options.otherOnly && options.priorityAssignmentsEnabled) {
    conditions.push(notInArray(schema.notification.type, ["assigned", "unassigned"]));
  }
  if (options.cursor) {
    const cursorAt = options.cursor.createdAt;
    const cursorIdCondition =
      options.order === "oldest"
        ? or(
            gt(schema.notification.createdAt, cursorAt),
            and(
              eq(schema.notification.createdAt, cursorAt),
              gt(schema.notification.id, options.cursor.id),
            ),
          )
        : or(
            lt(schema.notification.createdAt, cursorAt),
            and(
              eq(schema.notification.createdAt, cursorAt),
              lt(schema.notification.id, options.cursor.id),
            ),
          );
    if (cursorIdCondition) conditions.push(cursorIdCondition);
  }

  const rows = await db
    .select({
      id: schema.notification.id,
      type: schema.notification.type,
      actorId: actor.id,
      actorName: actor.name,
      actorAvatarUrl: actor.avatarUrl,
      issueId: schema.issue.id,
      issueIdentifier: sql<string>`${schema.team.key} || '-' || ${schema.issue.number}::text`,
      issueTitle: schema.issue.title,
      issuePriority: schema.issue.priority,
      statusId: schema.workflowStatus.id,
      statusName: schema.workflowStatus.name,
      statusCategory: schema.workflowStatus.category,
      statusColor: schema.workflowStatus.color,
      projectId: schema.notification.projectId,
      payload: schema.notification.payload,
      readAt: schema.notification.readAt,
      snoozedUntil: schema.notification.snoozedUntil,
      createdAt: schema.notification.createdAt,
      updatedAt: schema.notification.updatedAt,
    })
    .from(schema.notification)
    .innerJoin(
      recipient,
      and(
        eq(recipient.id, schema.notification.recipientId),
        eq(recipient.workspaceId, schema.notification.workspaceId),
      ),
    )
    .leftJoin(
      actor,
      and(eq(actor.id, schema.notification.actorId), eq(actor.workspaceId, workspaceId)),
    )
    .leftJoin(
      schema.issue,
      and(
        eq(schema.issue.id, schema.notification.issueId),
        eq(schema.issue.workspaceId, workspaceId),
      ),
    )
    .leftJoin(
      schema.team,
      and(eq(schema.team.id, schema.issue.teamId), eq(schema.team.workspaceId, workspaceId)),
    )
    .leftJoin(
      schema.workflowStatus,
      and(
        eq(schema.workflowStatus.id, schema.issue.statusId),
        eq(schema.workflowStatus.teamId, schema.issue.teamId),
      ),
    )
    .where(and(...conditions))
    .orderBy(
      options.order === "oldest"
        ? asc(schema.notification.createdAt)
        : desc(schema.notification.createdAt),
      options.order === "oldest" ? asc(schema.notification.id) : desc(schema.notification.id),
    )
    .limit(options.limit + 1);

  const hasMore = rows.length > options.limit;
  const items = rows.slice(0, options.limit).map((row) => ({
    id: row.id,
    type: row.type,
    isPriority:
      options.priorityAssignmentsEnabled === true &&
      (row.type === "assigned" || row.type === "unassigned"),
    actor: row.actorId
      ? { id: row.actorId, name: row.actorName ?? "", avatarUrl: row.actorAvatarUrl }
      : null,
    issue: row.issueId
      ? {
          id: row.issueId,
          identifier: row.issueIdentifier,
          title: row.issueTitle ?? "",
          priority: row.issuePriority ?? 0,
          status:
            row.statusId && row.statusName && row.statusCategory && row.statusColor
              ? {
                  id: row.statusId,
                  name: row.statusName,
                  category: row.statusCategory,
                  color: row.statusColor,
                }
              : null,
        }
      : null,
    projectId: row.projectId,
    payload: row.payload,
    readAt: row.readAt,
    snoozedUntil: row.snoozedUntil,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor: hasMore && lastItem ? { id: lastItem.id, createdAt: lastItem.createdAt } : null,
  };
}

/** Count unread, non-archived notifications for one Member in one Workspace. */
export async function countUnreadWorkspaceNotifications(
  db: DbSession,
  workspaceId: string,
  recipientId: string,
): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.notification)
    .where(
      and(
        eq(schema.notification.workspaceId, workspaceId),
        eq(schema.notification.recipientId, recipientId),
        isNull(schema.notification.archivedAt),
        isNull(schema.notification.readAt),
      ),
    );

  return result?.count ?? 0;
}

/** Mark only this Member's active notifications as read. */
export async function markWorkspaceNotificationsRead(
  db: DbSession,
  workspaceId: string,
  recipientId: string,
  ids: string[],
): Promise<void> {
  await db
    .update(schema.notification)
    .set({ readAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(schema.notification.workspaceId, workspaceId),
        eq(schema.notification.recipientId, recipientId),
        isNull(schema.notification.archivedAt),
        inArray(schema.notification.id, ids),
      ),
    );
}

/** Mark only this Member's active notifications as unread. */
export async function markWorkspaceNotificationsUnread(
  db: DbSession,
  workspaceId: string,
  recipientId: string,
  ids: string[],
): Promise<void> {
  await db
    .update(schema.notification)
    .set({ readAt: null, updatedAt: new Date() })
    .where(
      and(
        eq(schema.notification.workspaceId, workspaceId),
        eq(schema.notification.recipientId, recipientId),
        isNull(schema.notification.archivedAt),
        inArray(schema.notification.id, ids),
      ),
    );
}

/** Archive only this Member's active notifications (the issue remains untouched). */
export async function archiveWorkspaceNotifications(
  db: DbSession,
  workspaceId: string,
  recipientId: string,
  ids: string[],
): Promise<void> {
  const now = new Date();
  await db
    .update(schema.notification)
    .set({ archivedAt: now, updatedAt: now })
    .where(
      and(
        eq(schema.notification.workspaceId, workspaceId),
        eq(schema.notification.recipientId, recipientId),
        isNull(schema.notification.archivedAt),
        inArray(schema.notification.id, ids),
      ),
    );
}

/** Archive all of this Member's active notifications, optionally only those already read. */
export async function archiveAllWorkspaceNotifications(
  db: DbSession,
  workspaceId: string,
  recipientId: string,
  onlyRead: boolean,
): Promise<void> {
  const conditions = [
    eq(schema.notification.workspaceId, workspaceId),
    eq(schema.notification.recipientId, recipientId),
    isNull(schema.notification.archivedAt),
  ];
  if (onlyRead) conditions.push(isNotNull(schema.notification.readAt));

  const now = new Date();
  await db
    .update(schema.notification)
    .set({ archivedAt: now, updatedAt: now })
    .where(and(...conditions));
}
