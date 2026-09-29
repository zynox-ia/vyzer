/** Schema do banco. Entidades adicionadas por fatias de domínio; ver ADR-0005. */
import { relations } from "drizzle-orm";
import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

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
  },
  (table) => [uniqueIndex("member_workspace_email_unique").on(table.workspaceId, table.email)],
);

export const workspaceRelations = relations(workspace, ({ many }) => ({
  members: many(member),
}));

export const memberRelations = relations(member, ({ one }) => ({
  workspace: one(workspace, {
    fields: [member.workspaceId],
    references: [workspace.id],
  }),
}));
