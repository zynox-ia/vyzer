import { createHash, randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import {
  checkConnection,
  createWorkspaceApiKey,
  createTeamSlug,
  createWorkspaceTeam,
  deleteWorkspace,
  deleteWorkspaceTeam,
  findWorkspaceApiKey,
  getWorkspaceTeamBySlug,
  listWorkspaceApiKeys,
  listWorkspaceTeamMembers,
  listWorkspaceTeams,
  listWorkspaceMembers,
  resetWorkspaceTeamIssueEmail,
  revokeWorkspaceApiKey,
  updateWorkspaceApiKey,
  updateWorkspaceMemberName,
  updateWorkspaceSettings,
  updateWorkspaceTeam,
  WORKSPACE_REGION,
} from "@vyzer/db";
import {
  adminOnly,
  base,
  createWorkspaceMiddleware,
  type WorkspaceContextResolver,
  requireAdminOnly,
  requireApiKeyPermission,
  workspaceResolved,
  writeScoped,
  workspaceScoped,
} from "./orpc";

export function createRouter(resolveContext?: WorkspaceContextResolver) {
  const middleware = resolveContext
    ? createWorkspaceMiddleware(resolveContext)
    : { workspaceResolved, workspaceScoped, writeScoped, adminOnly };

  return base.router({
    health: middleware.workspaceScoped.health.handler(async ({ context }) => {
      await checkConnection(context.db);
      return { status: "ok" as const, database: "ok" as const };
    }),
    workspace: {
      current: middleware.workspaceScoped.workspace.current.handler(({ context }) => ({
        workspace: {
          id: context.workspace.id,
          name: context.workspace.name,
          slug: context.workspace.slug,
          fiscalYearStartMonth: context.workspace.fiscalYearStartMonth,
          region: WORKSPACE_REGION,
          logoUrl: context.workspace.logoUrl,
          icon: context.workspace.icon,
          apiKeyPolicy: context.workspace.apiKeyPolicy,
        },
        member: {
          id: context.member.id,
          name: context.member.name,
          email: context.member.email,
          role: context.member.role,
        },
      })),
      update: middleware.adminOnly.workspace.update.handler(async ({ context, input }) => {
        const updatedWorkspace = await updateWorkspaceSettings(
          context.db,
          context.workspace.id,
          input,
        );

        if (!updatedWorkspace) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Workspace resolved by middleware could not be updated.",
          });
        }

        return {
          id: updatedWorkspace.id,
          name: updatedWorkspace.name,
          slug: updatedWorkspace.slug,
          fiscalYearStartMonth: updatedWorkspace.fiscalYearStartMonth,
          region: WORKSPACE_REGION,
          logoUrl: updatedWorkspace.logoUrl,
          icon: updatedWorkspace.icon,
          apiKeyPolicy: updatedWorkspace.apiKeyPolicy,
        };
      }),
      delete: middleware.adminOnly.workspace.delete.handler(async ({ context }) => {
        await deleteWorkspace(context.db, context.workspace.id);
      }),
    },
    member: {
      list: middleware.workspaceScoped.member.list.handler(async ({ context }) =>
        (await listWorkspaceMembers(context.db, context.workspace.id)).map((currentMember) => ({
          id: currentMember.id,
          name: currentMember.name,
          email: currentMember.email,
          role: currentMember.role,
          createdAt: currentMember.createdAt.toISOString(),
          teamCount: currentMember.teamCount,
        })),
      ),
      update: middleware.adminOnly.member.update.handler(async ({ context, input }) => {
        const updatedMember = await updateWorkspaceMemberName(
          context.db,
          context.workspace.id,
          input.id,
          input.name,
        );

        if (!updatedMember) {
          throw new ORPCError("NOT_FOUND");
        }

        return {
          id: updatedMember.id,
          name: updatedMember.name,
          email: updatedMember.email,
          role: updatedMember.role,
          createdAt: updatedMember.createdAt.toISOString(),
        };
      }),
    },
    team: {
      list: middleware.workspaceScoped.team.list.handler(async ({ context }) =>
        (await listWorkspaceTeams(context.db, context.workspace.id)).map((currentTeam) => ({
          id: currentTeam.id,
          name: currentTeam.name,
          slug: currentTeam.slug,
          key: currentTeam.key,
          icon: currentTeam.icon,
          description: currentTeam.description,
          timezone: currentTeam.timezone,
          estimation: currentTeam.estimation,
          detailedIssueHistory: currentTeam.detailedIssueHistory,
          issueEmailEnabled: currentTeam.issueEmailEnabled,
          issueEmailAddress: currentTeam.issueEmailAddress,
          createdAt: currentTeam.createdAt.toISOString(),
          updatedAt: currentTeam.updatedAt.toISOString(),
          memberCount: currentTeam.memberCount,
          issueCount: currentTeam.issueCount,
        })),
      ),
      create: middleware.adminOnly.team.create.handler(async ({ context, input }) => {
        const slug = createTeamSlug(input.name);
        if (!slug) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Team name must include letters or numbers to create its URL.",
          });
        }

        let createdTeam;
        try {
          createdTeam = await createWorkspaceTeam(context.db, context.workspace.id, {
            ...input,
            slug,
          });
        } catch (error) {
          if (isUniqueConstraintViolation(error)) {
            throw new ORPCError("CONFLICT", {
              message: "A Team with this identifier or URL already exists in the Workspace.",
            });
          }
          throw error;
        }

        if (!createdTeam) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "The Team could not be created.",
          });
        }

        return {
          id: createdTeam.id,
          name: createdTeam.name,
          slug: createdTeam.slug,
          key: createdTeam.key,
          icon: createdTeam.icon,
          description: createdTeam.description,
          timezone: createdTeam.timezone,
          estimation: createdTeam.estimation,
          detailedIssueHistory: createdTeam.detailedIssueHistory,
          issueEmailEnabled: createdTeam.issueEmailEnabled,
          issueEmailAddress: createdTeam.issueEmailAddress,
          createdAt: createdTeam.createdAt.toISOString(),
          updatedAt: createdTeam.updatedAt.toISOString(),
        };
      }),
      get: middleware.workspaceScoped.team.get.handler(async ({ context, input }) => {
        const currentTeam = await getWorkspaceTeamBySlug(
          context.db,
          context.workspace.id,
          input.team,
        );
        if (!currentTeam) {
          throw new ORPCError("NOT_FOUND");
        }

        return {
          id: currentTeam.id,
          name: currentTeam.name,
          slug: currentTeam.slug,
          key: currentTeam.key,
          icon: currentTeam.icon,
          description: currentTeam.description,
          timezone: currentTeam.timezone,
          estimation: currentTeam.estimation,
          detailedIssueHistory: currentTeam.detailedIssueHistory,
          issueEmailEnabled: currentTeam.issueEmailEnabled,
          issueEmailAddress: currentTeam.issueEmailAddress,
          createdAt: currentTeam.createdAt.toISOString(),
          updatedAt: currentTeam.updatedAt.toISOString(),
        };
      }),
      update: middleware.adminOnly.team.update.handler(async ({ context, input }) => {
        let updatedTeam;
        try {
          updatedTeam = await updateWorkspaceTeam(context.db, context.workspace.id, input.id, {
            name: input.name,
            key: input.key,
            icon: input.icon,
            description: input.description,
            timezone: input.timezone,
            estimation: input.estimation,
            detailedIssueHistory: input.detailedIssueHistory,
            issueEmailEnabled: input.issueEmailEnabled,
          });
        } catch (error) {
          if (isUniqueConstraintViolation(error)) {
            throw new ORPCError("CONFLICT", {
              message: "This Team identifier is already taken in the Workspace.",
            });
          }
          throw error;
        }

        if (!updatedTeam) {
          throw new ORPCError("NOT_FOUND");
        }

        return {
          id: updatedTeam.id,
          name: updatedTeam.name,
          slug: updatedTeam.slug,
          key: updatedTeam.key,
          icon: updatedTeam.icon,
          description: updatedTeam.description,
          timezone: updatedTeam.timezone,
          estimation: updatedTeam.estimation,
          detailedIssueHistory: updatedTeam.detailedIssueHistory,
          issueEmailEnabled: updatedTeam.issueEmailEnabled,
          issueEmailAddress: updatedTeam.issueEmailAddress,
          createdAt: updatedTeam.createdAt.toISOString(),
          updatedAt: updatedTeam.updatedAt.toISOString(),
        };
      }),
      members: middleware.workspaceScoped.team.members.handler(async ({ context, input }) => {
        const teamMembers = await listWorkspaceTeamMembers(
          context.db,
          context.workspace.id,
          input.id,
        );
        if (!teamMembers) {
          throw new ORPCError("NOT_FOUND");
        }

        return teamMembers.map((currentMember) => ({
          id: currentMember.id,
          name: currentMember.name,
          email: currentMember.email,
          role: currentMember.role,
          createdAt: currentMember.createdAt.toISOString(),
        }));
      }),
      resetIssueEmail: middleware.adminOnly.team.resetIssueEmail.handler(
        async ({ context, input }) => {
          const updatedTeam = await resetWorkspaceTeamIssueEmail(
            context.db,
            context.workspace.id,
            input.id,
          );
          if (!updatedTeam) {
            throw new ORPCError("NOT_FOUND");
          }

          return {
            id: updatedTeam.id,
            name: updatedTeam.name,
            slug: updatedTeam.slug,
            key: updatedTeam.key,
            icon: updatedTeam.icon,
            description: updatedTeam.description,
            timezone: updatedTeam.timezone,
            estimation: updatedTeam.estimation,
            detailedIssueHistory: updatedTeam.detailedIssueHistory,
            issueEmailEnabled: updatedTeam.issueEmailEnabled,
            issueEmailAddress: updatedTeam.issueEmailAddress,
            createdAt: updatedTeam.createdAt.toISOString(),
            updatedAt: updatedTeam.updatedAt.toISOString(),
          };
        },
      ),
      delete: middleware.adminOnly.team.delete.handler(async ({ context, input }) => {
        const deletedTeam = await deleteWorkspaceTeam(context.db, context.workspace.id, input.id);
        if (!deletedTeam) {
          throw new ORPCError("NOT_FOUND");
        }
      }),
    },
    apiKey: {
      create: middleware.writeScoped.apiKey.create.handler(async ({ context, input }) => {
        if (context.workspace.apiKeyPolicy === "admins" && context.member.role !== "admin") {
          throw new ORPCError("FORBIDDEN");
        }
        if (
          context.member.role !== "admin" &&
          (input.permissions === "full" || input.permissions.includes("admin"))
        ) {
          throw new ORPCError("FORBIDDEN");
        }

        const token = `vyz_${randomBytes(32).toString("base64url")}`;
        const createdKey = await createWorkspaceApiKey(
          context.db,
          context.workspace.id,
          context.member.id,
          {
            name: input.name,
            tokenPrefix: token.slice(0, 8),
            tokenHash: createHash("sha256").update(token).digest("hex"),
            permissions: input.permissions,
          },
        );

        if (!createdKey) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "The API key could not be created.",
          });
        }

        return {
          key: {
            id: createdKey.id,
            memberId: context.member.id,
            memberName: context.member.name,
            memberEmail: context.member.email,
            name: createdKey.name,
            tokenPrefix: createdKey.tokenPrefix,
            permissions: createdKey.permissions,
            createdAt: createdKey.createdAt.toISOString(),
            lastUsedAt: createdKey.lastUsedAt?.toISOString() ?? null,
            revokedAt: createdKey.revokedAt?.toISOString() ?? null,
          },
          token,
        };
      }),
      update: middleware.workspaceResolved.apiKey.update.handler(async ({ context, input }) => {
        const key = await findWorkspaceApiKey(context.db, context.workspace.id, input.id);
        if (!key || key.revokedAt) throw new ORPCError("NOT_FOUND");

        if (key.memberId === context.member.id) {
          requireApiKeyPermission(context, "write");
        } else {
          requireAdminOnly(context);
        }

        if (
          context.member.role !== "admin" &&
          (input.permissions === "full" || input.permissions.includes("admin"))
        ) {
          throw new ORPCError("FORBIDDEN");
        }

        const updatedKey = await updateWorkspaceApiKey(context.db, context.workspace.id, input.id, {
          name: input.name,
          permissions: input.permissions,
        });
        if (!updatedKey) throw new ORPCError("NOT_FOUND");

        return {
          id: updatedKey.id,
          memberId: updatedKey.memberId,
          memberName: updatedKey.memberName,
          memberEmail: updatedKey.memberEmail,
          name: updatedKey.name,
          tokenPrefix: updatedKey.tokenPrefix,
          permissions: updatedKey.permissions,
          createdAt: updatedKey.createdAt.toISOString(),
          lastUsedAt: updatedKey.lastUsedAt?.toISOString() ?? null,
          revokedAt: updatedKey.revokedAt?.toISOString() ?? null,
        };
      }),
      list: middleware.workspaceResolved.apiKey.list.handler(async ({ context, input }) => {
        if (input.scope === "workspace") {
          requireAdminOnly(context);
        } else {
          requireApiKeyPermission(context, "read");
        }

        const keys = await listWorkspaceApiKeys(
          context.db,
          context.workspace.id,
          input.scope === "mine" ? context.member.id : undefined,
        );

        return keys.map((key) => ({
          id: key.id,
          memberId: key.memberId,
          memberName: key.memberName,
          memberEmail: key.memberEmail,
          name: key.name,
          tokenPrefix: key.tokenPrefix,
          permissions: key.permissions,
          createdAt: key.createdAt.toISOString(),
          lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
          revokedAt: key.revokedAt?.toISOString() ?? null,
        }));
      }),
      revoke: middleware.workspaceResolved.apiKey.revoke.handler(async ({ context, input }) => {
        const key = await findWorkspaceApiKey(context.db, context.workspace.id, input.id);
        if (!key) throw new ORPCError("NOT_FOUND");

        if (key.memberId === context.member.id) {
          requireApiKeyPermission(context, "write");
        } else {
          requireAdminOnly(context);
        }

        await revokeWorkspaceApiKey(context.db, context.workspace.id, input.id);
      }),
    },
  });
}

export const router = createRouter();

function isUniqueConstraintViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueConstraintViolation(error.cause);
}
