import { ORPCError } from "@orpc/server";
import {
  checkConnection,
  deleteWorkspace,
  listWorkspaceMembers,
  updateWorkspaceMemberName,
  updateWorkspaceSettings,
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
  });
}

export const router = createRouter();
