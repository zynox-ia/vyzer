/** Acesso ao banco (Drizzle + postgres.js). Ver ADR-0005. */
import { eq, sql } from "drizzle-orm";
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

/** Faz uma consulta trivial; lança erro se o banco não responder. */
export async function checkConnection(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}

export { MEMBER_ID, WORKSPACE_ID } from "./seed";
export { member, workspace } from "./schema";
