/** Schema do banco. Entidades adicionadas por fatias de domínio; ver ADR-0005. */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
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
  (table) => [uniqueIndex("member_workspace_email_unique").on(table.workspaceId, table.email)],
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
    uniqueIndex("team_workspace_slug_unique").on(table.workspaceId, table.slug),
    uniqueIndex("team_workspace_key_unique").on(table.workspaceId, table.key),
    uniqueIndex("team_issue_email_address_unique").on(table.issueEmailAddress),
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
}));

export const memberRelations = relations(member, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [member.workspaceId],
    references: [workspace.id],
  }),
  teamMemberships: many(teamMember),
}));

export const teamRelations = relations(team, ({ many, one }) => ({
  workspace: one(workspace, {
    fields: [team.workspaceId],
    references: [workspace.id],
  }),
  members: many(teamMember),
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
