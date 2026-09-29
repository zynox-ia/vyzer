import { ORPCError, implement } from "@orpc/server";
import { contract } from "@vyzer/contract";
import { MEMBER_ID, resolveWorkspaceMember, WORKSPACE_ID, type Db } from "@vyzer/db";

/** Contexto de cada chamada: banco e headers da requisição. */
export type Context = { db: Db; headers: Headers };

/** Implementador compartilhado; os middlewares de domínio partem daqui. */
export const base = implement(contract).$context<Context>();

/** ADR-0007 aplicado com os ids fixos da seed até a autenticação chegar (ADR-0015). */
export const workspaceScoped = base.use(async ({ context, next }) => {
  const resolved = await resolveWorkspaceMember(context.db, WORKSPACE_ID, MEMBER_ID);
  if (!resolved) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Seeded Workspace/Member context is missing or inconsistent.",
    });
  }

  return next({ context: resolved });
});
