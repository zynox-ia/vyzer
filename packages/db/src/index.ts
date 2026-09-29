/** Acesso ao banco (Drizzle + postgres.js). Ver ADR-0005. */
import { and, asc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** Segundos para desistir de abrir uma conexão (o padrão do postgres.js é 30). */
const CONNECT_TIMEOUT_SECONDS = 5;

export function createDb(url: string) {
  return drizzle({ client: postgres(url, { connect_timeout: CONNECT_TIMEOUT_SECONDS }), schema });
}

export type Db = ReturnType<typeof createDb>;

export type WorkspaceMemberContext = {
  workspace: typeof schema.workspace.$inferSelect;
  member: typeof schema.member.$inferSelect;
};

/** Resolve a fixed workspace/member pair and ensure that the member belongs to that workspace. */
export async function resolveWorkspaceMember(
  db: Db,
  workspaceId: string,
  memberId: string,
): Promise<WorkspaceMemberContext | null> {
  const [resolvedWorkspace] = await db
    .select()
    .from(schema.workspace)
    .where(eq(schema.workspace.id, workspaceId))
    .limit(1);
  const [resolvedMember] = await db
    .select()
    .from(schema.member)
    .where(eq(schema.member.id, memberId))
    .limit(1);

  if (
    !resolvedWorkspace ||
    !resolvedMember ||
    resolvedMember.workspaceId !== resolvedWorkspace.id
  ) {
    return null;
  }

  return { workspace: resolvedWorkspace, member: resolvedMember };
}

/** Update the editable fields of one Workspace and return the persisted row. */
export async function updateWorkspaceSettings(
  db: Db,
  workspaceId: string,
  values: Partial<
    Pick<typeof schema.workspace.$inferInsert, "name" | "slug" | "fiscalYearStartMonth" | "icon">
  >,
) {
  const [updatedWorkspace] = await db
    .update(schema.workspace)
    .set({ ...values, updatedAt: new Date() })
    .where(eq(schema.workspace.id, workspaceId))
    .returning();

  return updatedWorkspace ?? null;
}

/** Permanently delete a Workspace; Member rows cascade through the foreign key. */
export async function deleteWorkspace(db: Db, workspaceId: string): Promise<void> {
  await db.delete(schema.workspace).where(eq(schema.workspace.id, workspaceId));
}

/** List only the Members of the resolved Workspace in a stable name order. */
export async function listWorkspaceMembers(db: Db, workspaceId: string) {
  return db
    .select()
    .from(schema.member)
    .where(eq(schema.member.workspaceId, workspaceId))
    .orderBy(asc(schema.member.name));
}

/** Rename one Member only if it belongs to the resolved Workspace. */
export async function updateWorkspaceMemberName(
  db: Db,
  workspaceId: string,
  memberId: string,
  name: string,
) {
  const [updatedMember] = await db
    .update(schema.member)
    .set({ name })
    .where(and(eq(schema.member.id, memberId), eq(schema.member.workspaceId, workspaceId)))
    .returning();

  return updatedMember ?? null;
}

/** Faz uma consulta trivial; lança erro se o banco não responder. */
export async function checkConnection(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}

export { MEMBER_ID, WORKSPACE_ID, WORKSPACE_REGION } from "./seed";
export { member, workspace } from "./schema";
