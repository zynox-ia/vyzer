import { ORPCError } from "@orpc/server";
import {
  deleteWorkspaceGithubConnection,
  findWorkspaceGithubConnection,
  getOrCreateWorkspaceCodeReviewSettings,
  updateWorkspaceCodeReviewSettings,
} from "@zynox/db";
import type { createWorkspaceMiddleware } from "./orpc";

type Middleware = ReturnType<typeof createWorkspaceMiddleware>;

function serializeCodeReviewSettings(
  settings: NonNullable<Awaited<ReturnType<typeof getOrCreateWorkspaceCodeReviewSettings>>>,
) {
  return {
    workspaceId: settings.workspaceId,
    enabled: settings.enabled,
    autoConvertDraftPullRequests: settings.autoConvertDraftPullRequests,
    mergeStrategy: settings.mergeStrategy,
  };
}

export function createGithubPreferencesRouter(middleware: Middleware) {
  return {
    githubConnection: {
      get: middleware.workspaceScoped.githubConnection.get.handler(async ({ context }) => {
        const connection = await findWorkspaceGithubConnection(
          context.db,
          context.workspace.id,
          context.member.id,
        );
        if (!connection) return { status: "disconnected" as const };

        return {
          status: "connected" as const,
          githubUserId: connection.githubUserId,
          login: connection.githubLogin,
          avatarUrl: connection.githubAvatarUrl,
          connectedAt: connection.connectedAt.toISOString(),
        };
      }),
      disconnect: middleware.writeScoped.githubConnection.disconnect.handler(
        async ({ context }) => {
          await deleteWorkspaceGithubConnection(
            context.db,
            context.workspace.id,
            context.member.id,
          );
        },
      ),
    },
    codeReviews: {
      get: middleware.workspaceScoped.codeReviews.get.handler(async ({ context }) => {
        const settings = await getOrCreateWorkspaceCodeReviewSettings(
          context.db,
          context.workspace.id,
        );
        if (!settings) throw new ORPCError("INTERNAL_SERVER_ERROR");
        return serializeCodeReviewSettings(settings);
      }),
      update: middleware.adminOnly.codeReviews.update.handler(async ({ context, input }) => {
        const settings = await updateWorkspaceCodeReviewSettings(
          context.db,
          context.workspace.id,
          input,
        );
        if (!settings) throw new ORPCError("INTERNAL_SERVER_ERROR");
        return serializeCodeReviewSettings(settings);
      }),
    },
  };
}
