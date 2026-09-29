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
    Pick<
      typeof schema.workspace.$inferInsert,
      "name" | "slug" | "fiscalYearStartMonth" | "logoUrl" | "icon"
    >
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

/** List only the Members of the resolved Workspace in name order, including their Team count. */
export async function listWorkspaceMembers(db: Db, workspaceId: string) {
  return db
    .select({
      id: schema.member.id,
      workspaceId: schema.member.workspaceId,
      name: schema.member.name,
      email: schema.member.email,
      role: schema.member.role,
      createdAt: schema.member.createdAt,
      teamCount: sql<number>`count(${schema.team.id})::int`,
    })
    .from(schema.member)
    .leftJoin(schema.teamMember, eq(schema.teamMember.memberId, schema.member.id))
    .leftJoin(
      schema.team,
      and(eq(schema.team.id, schema.teamMember.teamId), eq(schema.team.workspaceId, workspaceId)),
    )
    .where(eq(schema.member.workspaceId, workspaceId))
    .groupBy(schema.member.id)
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

/** Create a URL-safe slug from a Team name. Slug collisions are reported by the database index. */
export function createTeamSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** List only Teams in the resolved Workspace with stable creation-order sorting and counts. */
export async function listWorkspaceTeams(db: Db, workspaceId: string) {
  return db
    .select({
      id: schema.team.id,
      name: schema.team.name,
      slug: schema.team.slug,
      key: schema.team.key,
      icon: schema.team.icon,
      description: schema.team.description,
      createdAt: schema.team.createdAt,
      updatedAt: schema.team.updatedAt,
      memberCount: sql<number>`count(${schema.member.id})::int`,
      issueCount: sql<number>`0`,
    })
    .from(schema.team)
    .leftJoin(schema.teamMember, eq(schema.teamMember.teamId, schema.team.id))
    .leftJoin(
      schema.member,
      and(
        eq(schema.member.id, schema.teamMember.memberId),
        eq(schema.member.workspaceId, workspaceId),
      ),
    )
    .where(eq(schema.team.workspaceId, workspaceId))
    .groupBy(schema.team.id)
    .orderBy(asc(schema.team.createdAt), asc(schema.team.id));
}

/** Create a Team within a Workspace resolved by the API middleware. */
export async function createWorkspaceTeam(
  db: Db,
  workspaceId: string,
  values: Pick<typeof schema.team.$inferInsert, "name" | "slug" | "key" | "icon">,
) {
  const [createdTeam] = await db
    .insert(schema.team)
    .values({ ...values, workspaceId })
    .returning();

  return createdTeam ?? null;
}

/** Delete one Team only if it belongs to the resolved Workspace. Project guard waits for Stage 3. */
export async function deleteWorkspaceTeam(db: Db, workspaceId: string, teamId: string) {
  const [deletedTeam] = await db
    .delete(schema.team)
    .where(and(eq(schema.team.id, teamId), eq(schema.team.workspaceId, workspaceId)))
    .returning({ id: schema.team.id });

  return deletedTeam ?? null;
}

/** Faz uma consulta trivial; lança erro se o banco não responder. */
export async function checkConnection(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}

export { MEMBER_ID, VYZER_TEAM_ID, WORKSPACE_ID, WORKSPACE_REGION, ZYNOX_TEAM_ID } from "./seed";
export { member, team, teamMember, workspace } from "./schema";
