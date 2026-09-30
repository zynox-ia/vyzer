import { ORPCError } from "@orpc/server";
import { getOrCreateSidebarPreferences, updateSidebarPreferences } from "@vyzer/db";
import type { createWorkspaceMiddleware } from "./orpc";

type Middleware = ReturnType<typeof createWorkspaceMiddleware>;

function preferencesOutput(
  preferences: NonNullable<Awaited<ReturnType<typeof getOrCreateSidebarPreferences>>>,
  workspaceId: string,
  memberId: string,
) {
  return {
    workspaceId,
    memberId,
    badgeStyle: preferences.preference.badgeStyle,
    items: preferences.items.map(({ itemKey, visibility, sortOrder }) => ({
      key: itemKey,
      visibility,
      sortOrder,
    })),
  };
}

export function createSidebarPreferencesRouter(middleware: Middleware) {
  return {
    sidebarPreferences: {
      get: middleware.workspaceScoped.sidebarPreferences.get.handler(async ({ context }) => {
        const preferences = await getOrCreateSidebarPreferences(
          context.db,
          context.workspace.id,
          context.member.id,
        );
        if (!preferences) throw new ORPCError("INTERNAL_SERVER_ERROR");

        return preferencesOutput(preferences, context.workspace.id, context.member.id);
      }),
      update: middleware.writeScoped.sidebarPreferences.update.handler(
        async ({ context, input }) => {
          const preferences = await updateSidebarPreferences(
            context.db,
            context.workspace.id,
            context.member.id,
            {
              badgeStyle: input.badgeStyle,
              items: input.items?.map(({ key, ...item }) => ({ itemKey: key, ...item })),
            },
          );
          if (!preferences) throw new ORPCError("INTERNAL_SERVER_ERROR");

          return preferencesOutput(preferences, context.workspace.id, context.member.id);
        },
      ),
    },
  };
}
