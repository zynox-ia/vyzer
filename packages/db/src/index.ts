/** Acesso ao banco (Drizzle + postgres.js). Ver ADR-0005. */
import { and, asc, desc, eq, isNull, lt, or, sql } from "drizzle-orm";
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

export type ApiKeyCreateValues = Pick<
  typeof schema.apiKey.$inferInsert,
  "name" | "tokenPrefix" | "tokenHash" | "permissions"
>;
export type ApiKeyUpdateValues = Pick<typeof schema.apiKey.$inferInsert, "name" | "permissions">;

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
      "name" | "slug" | "fiscalYearStartMonth" | "logoUrl" | "icon" | "apiKeyPolicy"
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

/** Persists only the secret hash and metadata for a personal API key. */
export async function createWorkspaceApiKey(
  db: Db,
  workspaceId: string,
  memberId: string,
  values: ApiKeyCreateValues,
) {
  const [createdKey] = await db
    .insert(schema.apiKey)
    .values({ ...values, workspaceId, memberId })
    .returning();

  return createdKey ?? null;
}

/** Finds an active key by its one-way token hash. */
export async function findActiveApiKeyByTokenHash(db: Db, tokenHash: string) {
  const [foundKey] = await db
    .select()
    .from(schema.apiKey)
    .where(and(eq(schema.apiKey.tokenHash, tokenHash), isNull(schema.apiKey.revokedAt)))
    .limit(1);

  return foundKey ?? null;
}

/** Touches last_used_at no more than once per key per minute, including concurrent requests. */
export async function touchWorkspaceApiKey(db: Db, keyId: string): Promise<void> {
  const oneMinuteAgo = new Date(Date.now() - 60_000);
  await db
    .update(schema.apiKey)
    .set({ lastUsedAt: new Date() })
    .where(
      and(
        eq(schema.apiKey.id, keyId),
        or(isNull(schema.apiKey.lastUsedAt), lt(schema.apiKey.lastUsedAt, oneMinuteAgo)),
      ),
    );
}

/** Lists keys and their creator only within the resolved Workspace and optional Member scope. */
export async function listWorkspaceApiKeys(db: Db, workspaceId: string, memberId?: string) {
  const conditions = [eq(schema.apiKey.workspaceId, workspaceId)];
  if (memberId) conditions.push(eq(schema.apiKey.memberId, memberId));

  return db
    .select({
      id: schema.apiKey.id,
      workspaceId: schema.apiKey.workspaceId,
      memberId: schema.apiKey.memberId,
      memberName: schema.member.name,
      memberEmail: schema.member.email,
      name: schema.apiKey.name,
      tokenPrefix: schema.apiKey.tokenPrefix,
      permissions: schema.apiKey.permissions,
      createdAt: schema.apiKey.createdAt,
      lastUsedAt: schema.apiKey.lastUsedAt,
      revokedAt: schema.apiKey.revokedAt,
    })
    .from(schema.apiKey)
    .innerJoin(schema.member, eq(schema.member.id, schema.apiKey.memberId))
    .where(and(...conditions, eq(schema.member.workspaceId, workspaceId)))
    .orderBy(desc(schema.apiKey.createdAt), asc(schema.apiKey.id));
}

/** Reads a key only when it belongs to the resolved Workspace. */
export async function findWorkspaceApiKey(db: Db, workspaceId: string, keyId: string) {
  const [foundKey] = await db
    .select()
    .from(schema.apiKey)
    .where(and(eq(schema.apiKey.id, keyId), eq(schema.apiKey.workspaceId, workspaceId)))
    .limit(1);

  return foundKey ?? null;
}

/** Updates editable fields only on an active key within the resolved Workspace. */
export async function updateWorkspaceApiKey(
  db: Db,
  workspaceId: string,
  keyId: string,
  values: ApiKeyUpdateValues,
) {
  const [updatedKey] = await db
    .update(schema.apiKey)
    .set(values)
    .where(
      and(
        eq(schema.apiKey.id, keyId),
        eq(schema.apiKey.workspaceId, workspaceId),
        isNull(schema.apiKey.revokedAt),
      ),
    )
    .returning({
      id: schema.apiKey.id,
      workspaceId: schema.apiKey.workspaceId,
      memberId: schema.apiKey.memberId,
      name: schema.apiKey.name,
      tokenPrefix: schema.apiKey.tokenPrefix,
      permissions: schema.apiKey.permissions,
      createdAt: schema.apiKey.createdAt,
      lastUsedAt: schema.apiKey.lastUsedAt,
      revokedAt: schema.apiKey.revokedAt,
    });

  if (!updatedKey) return null;

  const [owner] = await db
    .select({
      memberName: schema.member.name,
      memberEmail: schema.member.email,
    })
    .from(schema.member)
    .where(
      and(eq(schema.member.id, updatedKey.memberId), eq(schema.member.workspaceId, workspaceId)),
    )
    .limit(1);

  return owner ? { ...updatedKey, ...owner } : null;
}

/** Marks a key revoked only inside the resolved Workspace. */
export async function revokeWorkspaceApiKey(db: Db, workspaceId: string, keyId: string) {
  const [revokedKey] = await db
    .update(schema.apiKey)
    .set({ revokedAt: new Date() })
    .where(and(eq(schema.apiKey.id, keyId), eq(schema.apiKey.workspaceId, workspaceId)))
    .returning({ id: schema.apiKey.id });

  return revokedKey ?? null;
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
export { apiKey, member, team, teamMember, workspace } from "./schema";
export type { ApiKeyPermission, ApiKeyPermissions, ApiKeyPolicy } from "./schema";
