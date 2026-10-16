import { ORPCError } from "@orpc/server";
import { getOrCreateMemberPreferences, updateMemberPreferences } from "@zynox/db";
import type { createWorkspaceMiddleware } from "./orpc";

type Middleware = ReturnType<typeof createWorkspaceMiddleware>;

function preferencesOutput(
  preference: NonNullable<Awaited<ReturnType<typeof getOrCreateMemberPreferences>>>,
) {
  return {
    workspaceId: preference.workspaceId,
    memberId: preference.memberId,
    defaultHomeView: preference.defaultHomeView,
    displayNameFormat: preference.displayNameFormat,
    firstDayOfWeek: preference.firstDayOfWeek,
    convertEmoticons: preference.convertEmoticons,
    sendCommentsOn: preference.sendCommentsOn,
    interfaceFontSize: preference.interfaceFontSize,
    usePointerCursors: preference.usePointerCursors,
    underlineLinks: preference.underlineLinks,
    disableAnimatedImages: preference.disableAnimatedImages,
    interfaceTheme: preference.interfaceTheme,
    codeTheme: preference.codeTheme,
    codeFontSize: preference.codeFontSize,
    codeLineHeight: preference.codeLineHeight,
    codeFontFamily: preference.codeFontFamily,
    openInDesktopApp: preference.openInDesktopApp,
    autoAssignToSelf: preference.autoAssignToSelf,
    autoAssignOnMoveToStarted: preference.autoAssignOnMoveToStarted,
  };
}

export function createMemberPreferencesRouter(middleware: Middleware) {
  return {
    memberPreferences: {
      get: middleware.workspaceScoped.memberPreferences.get.handler(async ({ context }) => {
        const preference = await getOrCreateMemberPreferences(
          context.db,
          context.workspace.id,
          context.member.id,
        );
        if (!preference) throw new ORPCError("INTERNAL_SERVER_ERROR");

        return preferencesOutput(preference);
      }),
      update: middleware.writeScoped.memberPreferences.update.handler(
        async ({ context, input }) => {
          const preference = await updateMemberPreferences(
            context.db,
            context.workspace.id,
            context.member.id,
            input,
          );
          if (!preference) throw new ORPCError("INTERNAL_SERVER_ERROR");

          return preferencesOutput(preference);
        },
      ),
    },
  };
}
