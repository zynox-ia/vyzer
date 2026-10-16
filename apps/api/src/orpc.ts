import { createHash } from "node:crypto";
import { ORPCError, implement } from "@orpc/server";
import { contract } from "@zynox/contract";
import {
  MEMBER_ID,
  findActiveApiKeyByTokenHash,
  listAuthUserWorkspaceMemberships,
  resolveWorkspaceMember,
  touchWorkspaceApiKey,
  WORKSPACE_ID,
  type ApiKeyPermissions,
  type Db,
  type WorkspaceMemberContext,
} from "@zynox/db";
import type { ZynoxAuth } from "./auth";

/** Contexto de cada chamada: banco e headers da requisição. */
export type Context = { db: Db; headers: Headers };

export type ApiKeyAuthorization = { id: string; permissions: ApiKeyPermissions };
export type ResolvedWorkspaceContext = WorkspaceMemberContext & {
  apiKey?: ApiKeyAuthorization | null;
};
export type WorkspaceContextResolver = (
  db: Db,
  headers: Headers,
) => Promise<ResolvedWorkspaceContext | null>;

type AuthenticatedSession = {
  session: { id: string; activeWorkspaceId?: string | null };
  user: { id: string };
};

type SessionReader = (headers: Headers) => Promise<AuthenticatedSession | null>;
type WorkspaceMembership = { id: string; workspaceId: string };

/** Implementador compartilhado; os middlewares de domínio partem daqui. */
export const base = implement(contract).$context<Context>();

/** Resolve a seed sem header e usa o Workspace/Member da chave quando há Bearer. */
export const resolveSeededWorkspaceContext: WorkspaceContextResolver = async (db, headers) => {
  const authorization = headers.get("authorization");
  if (authorization === null) {
    const seeded = await resolveWorkspaceMember(db, WORKSPACE_ID, MEMBER_ID);
    return seeded ? { ...seeded, apiKey: null } : null;
  }

  const token = parseApiKeyBearer(authorization);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const key = await findActiveApiKeyByTokenHash(db, tokenHash);
  if (!key) throw new ORPCError("UNAUTHORIZED");

  const resolved = await resolveWorkspaceMember(db, key.workspaceId, key.memberId);
  if (!resolved) throw new ORPCError("UNAUTHORIZED");

  if (!key.lastUsedAt || key.lastUsedAt.getTime() <= Date.now() - 60_000) {
    await touchWorkspaceApiKey(db, key.id);
  }
  return { ...resolved, apiKey: { id: key.id, permissions: key.permissions } };
};

/**
 * Resolves the domain Member and Workspace from an authenticated session. A
 * user with exactly one membership may omit an active Workspace; otherwise an
 * explicit session selection is required so a request can never guess scope.
 */
export function createSessionWorkspaceContextResolver(
  readSession: SessionReader,
): WorkspaceContextResolver {
  return async (db, headers) => {
    const authenticated = await readSession(headers);
    if (!authenticated) return null;

    const memberships = await listAuthUserWorkspaceMemberships(db, authenticated.user.id);

    const activeWorkspaceId = authenticated.session.activeWorkspaceId;
    const membership = selectSessionMembership(memberships, activeWorkspaceId);
    if (!membership) return null;

    const resolved = await resolveWorkspaceMember(db, membership.workspaceId, membership.id);
    return resolved ? { ...resolved, apiKey: null } : null;
  };
}

/** Pure scope selection rule, kept independent from session/database adapters for testing. */
export function selectSessionMembership(
  memberships: WorkspaceMembership[],
  activeWorkspaceId: string | null | undefined,
): WorkspaceMembership | undefined {
  if (activeWorkspaceId) {
    return memberships.find((candidate) => candidate.workspaceId === activeWorkspaceId);
  }
  if (memberships.length !== 1) return undefined;
  return memberships[0]!;
}

/**
 * Runtime resolver: bearer API keys retain their scoped capability model,
 * while browser and Desktop requests derive identity exclusively from Better
 * Auth's server-side session.
 */
export function createAuthenticatedWorkspaceContextResolver(
  auth: ZynoxAuth,
): WorkspaceContextResolver {
  const sessionResolver = createSessionWorkspaceContextResolver(async (headers) => {
    const current = await auth.api.getSession({ headers });
    if (!current) return null;
    return {
      session: {
        id: current.session.id,
        activeWorkspaceId: current.session.activeWorkspaceId,
      },
      user: { id: current.user.id },
    };
  });

  return async (db, headers) => {
    if (headers.has("authorization")) {
      return resolveApiKeyWorkspaceContext(db, headers);
    }
    return sessionResolver(db, headers);
  };
}

async function resolveApiKeyWorkspaceContext(
  db: Db,
  headers: Headers,
): Promise<ResolvedWorkspaceContext | null> {
  const authorization = headers.get("authorization");
  if (authorization === null) return null;

  const token = parseApiKeyBearer(authorization);
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const key = await findActiveApiKeyByTokenHash(db, tokenHash);
  if (!key) throw new ORPCError("UNAUTHORIZED");

  const resolved = await resolveWorkspaceMember(db, key.workspaceId, key.memberId);
  if (!resolved) throw new ORPCError("UNAUTHORIZED");

  if (!key.lastUsedAt || key.lastUsedAt.getTime() <= Date.now() - 60_000) {
    await touchWorkspaceApiKey(db, key.id);
  }
  return { ...resolved, apiKey: { id: key.id, permissions: key.permissions } };
}

/** Require the requested capability when the call authenticates with an API key. */
export function requireApiKeyPermission(
  context: ResolvedWorkspaceContext,
  required: "read" | "write" | "admin" | "issues:create" | "comments:create",
): void {
  if (!context.apiKey) return;
  const permissions = context.apiKey.permissions;
  if (permissions === "full") return;

  const granted = new Set(permissions);
  const allowed =
    required === "read"
      ? granted.has("read") || granted.has("write")
      : required === "write"
        ? granted.has("write")
        : required === "issues:create"
          ? granted.has("issues:create") || granted.has("write")
          : required === "comments:create"
            ? granted.has("comments:create") || granted.has("write")
            : granted.has("admin");

  if (!allowed) throw new ORPCError("FORBIDDEN");
}

/** `adminOnly` requires both the key capability and the Member's Workspace role. */
export function requireAdminOnly(context: ResolvedWorkspaceContext): void {
  requireApiKeyPermission(context, "admin");
  if (context.member.role !== "admin") throw new ORPCError("FORBIDDEN");
}

/** ADR-0007 scope with an injectable identity resolver for authorization tests. */
export function createWorkspaceMiddleware(
  resolveContext: WorkspaceContextResolver = resolveSeededWorkspaceContext,
) {
  const workspaceContext = base.use(async ({ context, next }) => {
    const resolved = await resolveContext(context.db, context.headers);
    if (!resolved) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Workspace/Member context could not be resolved.",
      });
    }

    const workspaceContext = { ...resolved, apiKey: resolved.apiKey ?? null };
    return next({ context: workspaceContext });
  });

  const workspaceScoped = workspaceContext.use(async ({ context, next }) => {
    requireApiKeyPermission(context, "read");
    return next({ context });
  });

  const writeScoped = workspaceContext.use(async ({ context, next }) => {
    requireApiKeyPermission(context, "write");
    return next({ context });
  });

  const adminOnly = workspaceContext.use(async ({ context, next }) => {
    requireAdminOnly(context);
    return next({ context });
  });

  return { workspaceResolved: workspaceContext, workspaceScoped, writeScoped, adminOnly };
}

export const { workspaceResolved, workspaceScoped, writeScoped, adminOnly } =
  createWorkspaceMiddleware();

function parseApiKeyBearer(authorization: string): string {
  const match = /^Bearer ([^\s]+)$/i.exec(authorization);
  const token = match?.[1];
  if (!token || !/^vyz_[A-Za-z0-9_-]{43}$/.test(token)) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const encodedBytes = token.slice(4);
  const bytes = Buffer.from(encodedBytes, "base64url");
  if (bytes.byteLength !== 32 || bytes.toString("base64url") !== encodedBytes) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return token;
}
