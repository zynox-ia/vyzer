import { ORPCError, implement } from "@orpc/server";
import { contract } from "@vyzer/contract";
import {
  MEMBER_ID,
  resolveWorkspaceMember,
  WORKSPACE_ID,
  type Db,
  type WorkspaceMemberContext,
} from "@vyzer/db";

/** Contexto de cada chamada: banco e headers da requisição. */
export type Context = { db: Db; headers: Headers };

export type WorkspaceContextResolver = (db: Db) => Promise<WorkspaceMemberContext | null>;

/** Implementador compartilhado; os middlewares de domínio partem daqui. */
export const base = implement(contract).$context<Context>();

/** ADR-0007 aplicado com os ids fixos da seed até a autenticação chegar (ADR-0015). */
export const resolveSeededWorkspaceContext: WorkspaceContextResolver = (db) =>
  resolveWorkspaceMember(db, WORKSPACE_ID, MEMBER_ID);

/** ADR-0007 scope with an injectable identity resolver for authorization tests. */
export function createWorkspaceMiddleware(
  resolveContext: WorkspaceContextResolver = resolveSeededWorkspaceContext,
) {
  const workspaceScoped = base.use(async ({ context, next }) => {
    const resolved = await resolveContext(context.db);
    if (!resolved) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Workspace/Member context could not be resolved.",
      });
    }

    return next({ context: resolved });
  });

  const adminOnly = workspaceScoped.use(async ({ context, next }) => {
    if (context.member.role !== "admin") {
      throw new ORPCError("FORBIDDEN");
    }

    return next({ context });
  });

  return { workspaceScoped, adminOnly };
}

export const { workspaceScoped, adminOnly } = createWorkspaceMiddleware();
