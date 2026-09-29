/** Schema do banco. Entidades adicionadas por fatias de domínio; ver ADR-0005. */
import { relations, sql } from "drizzle-orm";
import {
  check,
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

export type IssuePriority = 0 | 1 | 2 | 3 | 4;

export type IssueEventType =
  | "created"
  | "status"
  | "priority"
  | "assignee"
  | "title"
  | "description"
  | "due_date"
  | "team";

export type IssueEventPayload = Record<string, unknown>;

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
      sql`${table.type} in ('created', 'status', 'priority', 'assignee', 'title', 'description', 'due_date', 'team')`,
    ),
    index("issue_event_workspace_issue_created_index").on(
      table.workspaceId,
      table.issueId,
      table.createdAt,
    ),
  ],
);

export const workspaceRelations = relations(workspace, ({ many }) => ({
  members: many(member),
  teams: many(team),
  issues: many(issue),
  issueEvents: many(issueEvent),
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
}));

export const teamRelations = relations(team, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [team.workspaceId],
    references: [workspace.id],
  }),
  members: many(teamMember),
  workflowStatuses: many(workflowStatus),
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
}));

export const issueEventRelations = relations(issueEvent, ({ one }) => ({
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
