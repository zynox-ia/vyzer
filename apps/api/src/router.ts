import { ORPCError } from "@orpc/server";
import {
  checkConnection,
  createTeamSlug,
  createWorkspaceTeam,
  deleteWorkspace,
  deleteWorkspaceTeam,
  getWorkspaceTeamBySlug,
  listWorkspaceTeamMembers,
  listWorkspaceTeams,
  listWorkspaceMembers,
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
  workspaceScoped,
} from "./orpc";

export function createRouter(resolveContext?: WorkspaceContextResolver) {
  const middleware = resolveContext
    ? createWorkspaceMiddleware(resolveContext)
    : { workspaceScoped, adminOnly };

  return base.router({
    health: base.health.handler(async ({ context }) => {
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
      delete: middleware.adminOnly.team.delete.handler(async ({ context, input }) => {
        const deletedTeam = await deleteWorkspaceTeam(context.db, context.workspace.id, input.id);
        if (!deletedTeam) {
          throw new ORPCError("NOT_FOUND");
        }
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
