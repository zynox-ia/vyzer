/** Schema do banco. Entidades adicionadas por fatias de domínio; ver ADR-0005. */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
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
  (table) => [
    uniqueIndex("member_id_workspace_unique").on(table.id, table.workspaceId),
    uniqueIndex("member_workspace_email_unique").on(table.workspaceId, table.email),
  ],
);

type TeamIconValue = WorkspaceIconValue;

export const teamEstimation = pgEnum("team_estimation", [
  "none",
  "exponential",
  "fibonacci",
  "linear",
  "tshirt",
]);

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
    timezone: text("timezone").notNull().default("America/Sao_Paulo"),
    estimation: teamEstimation("estimation").notNull().default("none"),
    detailedIssueHistory: boolean("detailed_issue_history").notNull().default(false),
    issueEmailEnabled: boolean("issue_email_enabled").notNull().default(false),
    issueEmailAddress: text("issue_email_address")
      .notNull()
      .default(
        sql`('team-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12) || '@intake.vyzer.app.br')`,
      ),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("team_id_workspace_unique").on(table.id, table.workspaceId),
    uniqueIndex("team_workspace_slug_unique").on(table.workspaceId, table.slug),
    uniqueIndex("team_workspace_key_unique").on(table.workspaceId, table.key),
    uniqueIndex("team_issue_email_address_unique").on(table.issueEmailAddress),
  ],
);

export const projectStatus = pgEnum("project_status", [
  "backlog",
  "planned",
  "started",
  "completed",
  "canceled",
]);

export const projectHealth = pgEnum("project_health", ["on-track", "at-risk", "off-track", "none"]);

export const projectPriority = pgEnum("project_priority", [
  "none",
  "urgent",
  "high",
  "medium",
  "low",
]);

export const project = pgTable(
  "project",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .notNull()
      .references(() => workspace.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    icon: jsonb("icon").$type<TeamIconValue>().notNull(),
    status: projectStatus("status").notNull(),
    health: projectHealth("health").notNull(),
    healthNote: text("health_note"),
    priority: projectPriority("priority"),
    leadMemberId: uuid("lead_member_id"),
    targetDate: date("target_date", { mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("project_id_workspace_unique").on(table.id, table.workspaceId),
    foreignKey({
      name: "project_lead_member_workspace_fk",
      columns: [table.leadMemberId, table.workspaceId],
      foreignColumns: [member.id, member.workspaceId],
    })
      // The migration targets only lead_member_id so workspace_id remains non-null.
      .onDelete("set null"),
    index("project_workspace_created_index").on(table.workspaceId, table.createdAt, table.id),
  ],
);

export const projectTeam = pgTable(
  "project_team",
  {
    projectId: uuid("project_id").notNull(),
    teamId: uuid("team_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.teamId] }),
    foreignKey({
      name: "project_team_project_workspace_fk",
      columns: [table.projectId, table.workspaceId],
      foreignColumns: [project.id, project.workspaceId],
    }).onDelete("cascade"),
    foreignKey({
      name: "project_team_team_workspace_fk",
      columns: [table.teamId, table.workspaceId],
      foreignColumns: [team.id, team.workspaceId],
    }).onDelete("restrict"),
    index("project_team_workspace_team_index").on(table.workspaceId, table.teamId),
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

export const workspaceRelations = relations(workspace, ({ many }) => ({
  members: many(member),
  teams: many(team),
  projects: many(project),
}));

export const memberRelations = relations(member, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [member.workspaceId],
    references: [workspace.id],
  }),
  teamMemberships: many(teamMember),
  projects: many(project),
}));

export const teamRelations = relations(team, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [team.workspaceId],
    references: [workspace.id],
  }),
  members: many(teamMember),
  projects: many(projectTeam),
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

export const projectRelations = relations(project, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [project.workspaceId],
    references: [workspace.id],
  }),
  lead: one(member, {
    fields: [project.leadMemberId, project.workspaceId],
    references: [member.id, member.workspaceId],
  }),
  teams: many(projectTeam),
}));

export const projectTeamRelations = relations(projectTeam, ({ one }) => ({
  project: one(project, {
    fields: [projectTeam.projectId],
    references: [project.id],
  }),
  team: one(team, {
    fields: [projectTeam.teamId],
    references: [team.id],
  }),
}));
