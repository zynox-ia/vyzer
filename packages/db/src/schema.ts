/** Schema do banco. Entidades adicionadas por fatias de domínio; ver ADR-0005. */
import { relations, sql } from "drizzle-orm";
import {
  check,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

/** Structural shape shared with ProjectIconValue in the design system and API contract. */
type WorkspaceIconValue =
  | {
      kind: "icon";
      name: string;
      color:
        | "grey"
        | "slate"
        | "purple"
        | "cyan"
        | "green"
        | "amber"
        | "orange"
        | "pink"
        | "red"
        | `#${string}`;
    }
  | { kind: "emoji"; emoji: string };

export const workspace = pgTable("workspace", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  fiscalYearStartMonth: integer("fiscal_year_start_month").notNull().default(1),
  logoUrl: text("logo_url"),
  icon: jsonb("icon")
    .$type<WorkspaceIconValue>()
    .notNull()
    .default({ kind: "icon", name: "Zap", color: "red" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const member = pgTable(
  "member",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("member_workspace_email_unique").on(table.workspaceId, table.email)],
);

type TeamIconValue = WorkspaceIconValue;

export const team = pgTable(
  "team",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    key: text("key").notNull(),
    icon: jsonb("icon").$type<TeamIconValue>().notNull(),
    description: text("description"),
    defaultStatusId: uuid("default_status_id").references((): AnyPgColumn => workflowStatus.id, {
      onDelete: "set null",
    }),
    issueCounter: integer("issue_counter").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("team_workspace_slug_unique").on(table.workspaceId, table.slug),
    uniqueIndex("team_workspace_key_unique").on(table.workspaceId, table.key),
  ],
);

export type WorkflowStatusCategory =
  | "triage"
  | "backlog"
  | "unstarted"
  | "started"
  | "completed"
  | "canceled"
  | "duplicate";

export type WorkflowStatusColor =
  | "grey"
  | "slate"
  | "purple"
  | "cyan"
  | "green"
  | "amber"
  | "orange"
  | "pink"
  | "red";

export type LabelColor = WorkflowStatusColor;

export const workflowStatus = pgTable(
  "workflow_status",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references((): AnyPgColumn => team.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").$type<WorkflowStatusCategory>().notNull(),
    color: text("color").$type<WorkflowStatusColor>().notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "workflow_status_category_check",
      sql`${table.category} in ('triage', 'backlog', 'unstarted', 'started', 'completed', 'canceled', 'duplicate')`,
    ),
    check(
      "workflow_status_color_check",
      sql`${table.color} in ('grey', 'slate', 'purple', 'cyan', 'green', 'amber', 'orange', 'pink', 'red')`,
    ),
    check("workflow_status_position_check", sql`${table.position} >= 0`),
    // Linear has same-name statuses in separate categories (e.g. Zynox's Ready in Unstarted and Started).
    uniqueIndex("workflow_status_team_category_name_unique").on(
      table.teamId,
      table.category,
      table.name,
    ),
    uniqueIndex("workflow_status_team_duplicate_unique")
      .on(table.teamId)
      .where(sql`${table.category} = 'duplicate'`),
  ],
);

export const teamMember = pgTable(
  "team_member",
  {
    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    memberId: uuid("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.memberId] })],
);

export const label = pgTable(
  "label",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    teamId: uuid("team_id").references(() => team.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id").references((): AnyPgColumn => label.id, {
      onDelete: "cascade",
    }),
    isGroup: boolean("is_group").notNull().default(false),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color").$type<LabelColor>().notNull().default("grey"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "label_color_check",
      sql`${table.color} in ('grey', 'slate', 'purple', 'cyan', 'green', 'amber', 'orange', 'pink', 'red')`,
    ),
    check(
      "label_not_own_parent_check",
      sql`${table.parentId} is null or ${table.parentId} <> ${table.id}`,
    ),
    uniqueIndex("label_workspace_name_unique")
      .on(table.workspaceId, sql`lower(${table.name})`)
      .where(sql`${table.teamId} is null`),
    uniqueIndex("label_team_name_unique")
      .on(table.teamId, sql`lower(${table.name})`)
      .where(sql`${table.teamId} is not null`),
    index("label_parent_index").on(table.parentId),
    index("label_workspace_team_index").on(table.workspaceId, table.teamId),
  ],
);

export type IssuePriority = 0 | 1 | 2 | 3 | 4;

export type IssueRelationType = "blocks" | "related" | "duplicate";

export type IssueEventType =
  | "created"
  | "status"
  | "priority"
  | "assignee"
  | "title"
  | "description"
  | "due_date"
  | "label_added"
  | "label_removed"
  | "team"
  | "relation_added"
  | "relation_removed";

export type IssueEventPayload = Record<string, unknown>;

export type NotificationType = "assigned" | "unassigned";

export const issue = pgTable(
  "issue",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => team.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    statusId: uuid("status_id")
      .notNull()
      .references(() => workflowStatus.id, { onDelete: "restrict" }),
    priority: integer("priority").$type<IssuePriority>().notNull().default(0),
    assigneeId: uuid("assignee_id").references(() => member.id, { onDelete: "set null" }),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => member.id),
    parentId: uuid("parent_id").references((): AnyPgColumn => issue.id, { onDelete: "set null" }),
    dueDate: date("due_date", { mode: "string" }),
    sortOrder: integer("sort_order").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    canceledAt: timestamp("canceled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("issue_number_check", sql`${table.number} > 0`),
    check("issue_priority_check", sql`${table.priority} between 0 and 4`),
    check("issue_sort_order_check", sql`${table.sortOrder} >= 0`),
    uniqueIndex("issue_team_number_unique").on(table.teamId, table.number),
    index("issue_workspace_team_index").on(table.workspaceId, table.teamId),
    index("issue_team_status_index").on(table.teamId, table.statusId),
    index("issue_parent_index").on(table.parentId),
  ],
);

export const issueEvent = pgTable(
  "issue_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => member.id),
    type: text("type").$type<IssueEventType>().notNull(),
    payload: jsonb("payload").$type<IssueEventPayload>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "issue_event_type_check",
      sql`${table.type} in ('created', 'status', 'priority', 'assignee', 'title', 'description', 'due_date', 'label_added', 'label_removed', 'team', 'relation_added', 'relation_removed')`,
    ),
    index("issue_event_workspace_issue_created_index").on(
      table.workspaceId,
      table.issueId,
      table.createdAt,
    ),
  ],
);

export const issueRelation = pgTable(
  "issue_relation",
  {
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    relatedIssueId: uuid("related_issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    type: text("type").$type<IssueRelationType>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("issue_relation_type_check", sql`${table.type} in ('blocks', 'related', 'duplicate')`),
    check("issue_relation_not_self_check", sql`${table.issueId} <> ${table.relatedIssueId}`),
    primaryKey({ columns: [table.issueId, table.relatedIssueId, table.type] }),
    index("issue_relation_related_index").on(table.relatedIssueId, table.type),
  ],
);

export const issueLink = pgTable(
  "issue_link",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title"),
    creatorId: uuid("creator_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      "issue_link_http_url_check",
      sql`lower(${table.url}) like 'http://%' or lower(${table.url}) like 'https://%'`,
    ),
    index("issue_link_issue_created_index").on(table.issueId, table.createdAt),
  ],
);

export const issueLabel = pgTable(
  "issue_label",
  {
    issueId: uuid("issue_id")
      .notNull()
      .references(() => issue.id, { onDelete: "cascade" }),
    labelId: uuid("label_id")
      .notNull()
      .references(() => label.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.issueId, table.labelId] }),
    index("issue_label_label_index").on(table.labelId),
  ],
);

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    type: text("type").$type<NotificationType>().notNull(),
    actorId: uuid("actor_id").references(() => member.id, { onDelete: "set null" }),
    issueId: uuid("issue_id").references(() => issue.id, { onDelete: "cascade" }),
    // Project notifications arrive with the Project domain; the FK is added when that table lands.
    projectId: uuid("project_id"),
    issueEventId: uuid("issue_event_id").references(() => issueEvent.id, {
      onDelete: "set null",
    }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    snoozedUntil: timestamp("snoozed_until", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check("notification_type_check", sql`${table.type} in ('assigned', 'unassigned')`),
    check(
      "notification_target_check",
      sql`(${table.issueId} is not null and ${table.projectId} is null) or (${table.issueId} is null and ${table.projectId} is not null)`,
    ),
    uniqueIndex("notification_recipient_issue_event_unique")
      .on(table.recipientId, table.issueEventId)
      .where(sql`${table.issueEventId} is not null`),
    index("notification_recipient_archived_created_index").on(
      table.recipientId,
      table.archivedAt,
      sql`${table.createdAt} desc`,
    ),
    index("notification_unread_recipient_index")
      .on(table.recipientId, table.createdAt)
      .where(sql`${table.readAt} is null and ${table.archivedAt} is null`),
    index("notification_issue_index").on(table.issueId),
  ],
);

export const workspaceRelations = relations(workspace, ({ many }) => ({
  members: many(member),
  teams: many(team),
  issues: many(issue),
  issueEvents: many(issueEvent),
  labels: many(label),
  notifications: many(notification),
}));

export const memberRelations = relations(member, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [member.workspaceId],
    references: [workspace.id],
  }),
  teamMemberships: many(teamMember),
  assignedIssues: many(issue, { relationName: "issueAssignee" }),
  createdIssues: many(issue, { relationName: "issueCreator" }),
  authoredIssueEvents: many(issueEvent, { relationName: "issueEventActor" }),
  createdIssueLinks: many(issueLink),
  receivedNotifications: many(notification, { relationName: "notificationRecipient" }),
  notificationsAsActor: many(notification, { relationName: "notificationActor" }),
}));

export const teamRelations = relations(team, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [team.workspaceId],
    references: [workspace.id],
  }),
  members: many(teamMember),
  workflowStatuses: many(workflowStatus),
  labels: many(label),
  issues: many(issue),
  defaultStatus: one(workflowStatus, {
    fields: [team.defaultStatusId],
    references: [workflowStatus.id],
  }),
}));

export const workflowStatusRelations = relations(workflowStatus, ({ many, one }) => ({
  team: one(team, {
    fields: [workflowStatus.teamId],
    references: [team.id],
  }),
  issues: many(issue),
}));

export const issueRelations = relations(issue, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [issue.workspaceId],
    references: [workspace.id],
  }),
  team: one(team, {
    fields: [issue.teamId],
    references: [team.id],
  }),
  status: one(workflowStatus, {
    fields: [issue.statusId],
    references: [workflowStatus.id],
  }),
  parent: one(issue, {
    fields: [issue.parentId],
    references: [issue.id],
    relationName: "issueParent",
  }),
  subIssues: many(issue, { relationName: "issueParent" }),
  assignee: one(member, {
    fields: [issue.assigneeId],
    references: [member.id],
    relationName: "issueAssignee",
  }),
  creator: one(member, {
    fields: [issue.creatorId],
    references: [member.id],
    relationName: "issueCreator",
  }),
  events: many(issueEvent),
  labels: many(issueLabel),
  outgoingRelations: many(issueRelation, { relationName: "issueRelationSource" }),
  incomingRelations: many(issueRelation, { relationName: "issueRelationTarget" }),
  links: many(issueLink),
  notifications: many(notification),
}));

export const labelRelations = relations(label, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [label.workspaceId],
    references: [workspace.id],
  }),
  team: one(team, {
    fields: [label.teamId],
    references: [team.id],
  }),
  parent: one(label, {
    fields: [label.parentId],
    references: [label.id],
    relationName: "labelParent",
  }),
  children: many(label, { relationName: "labelParent" }),
  issues: many(issueLabel),
}));

export const issueLabelRelations = relations(issueLabel, ({ one }) => ({
  issue: one(issue, {
    fields: [issueLabel.issueId],
    references: [issue.id],
  }),
  label: one(label, {
    fields: [issueLabel.labelId],
    references: [label.id],
  }),
}));

export const issueRelationRelations = relations(issueRelation, ({ one }) => ({
  issue: one(issue, {
    fields: [issueRelation.issueId],
    references: [issue.id],
    relationName: "issueRelationSource",
  }),
  relatedIssue: one(issue, {
    fields: [issueRelation.relatedIssueId],
    references: [issue.id],
    relationName: "issueRelationTarget",
  }),
}));

export const issueLinkRelations = relations(issueLink, ({ one }) => ({
  issue: one(issue, { fields: [issueLink.issueId], references: [issue.id] }),
  creator: one(member, { fields: [issueLink.creatorId], references: [member.id] }),
}));

export const issueEventRelations = relations(issueEvent, ({ one, many }) => ({
  workspace: one(workspace, {
    fields: [issueEvent.workspaceId],
    references: [workspace.id],
  }),
  issue: one(issue, {
    fields: [issueEvent.issueId],
    references: [issue.id],
  }),
  actor: one(member, {
    fields: [issueEvent.actorId],
    references: [member.id],
    relationName: "issueEventActor",
  }),
  notifications: many(notification),
}));

export const notificationRelations = relations(notification, ({ one }) => ({
  workspace: one(workspace, {
    fields: [notification.workspaceId],
    references: [workspace.id],
  }),
  recipient: one(member, {
    fields: [notification.recipientId],
    references: [member.id],
    relationName: "notificationRecipient",
  }),
  actor: one(member, {
    fields: [notification.actorId],
    references: [member.id],
    relationName: "notificationActor",
  }),
  issue: one(issue, {
    fields: [notification.issueId],
    references: [issue.id],
  }),
  issueEvent: one(issueEvent, {
    fields: [notification.issueEventId],
    references: [issueEvent.id],
  }),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, {
    fields: [teamMember.teamId],
    references: [team.id],
  }),
  member: one(member, {
    fields: [teamMember.memberId],
    references: [member.id],
  }),
}));
