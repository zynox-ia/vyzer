import { ORPCError } from "@orpc/server";
import {
  getOrCreateNotificationPreferences,
  getOrCreateNotificationTypePreferences,
  updateNotificationPreferences,
  updateNotificationTypePreferences,
} from "@zynox/db";
import type { createWorkspaceMiddleware } from "./orpc";

type Middleware = ReturnType<typeof createWorkspaceMiddleware>;

function preferencesOutput(
  preference: NonNullable<Awaited<ReturnType<typeof getOrCreateNotificationPreferences>>>,
) {
  return {
    workspaceId: preference.workspaceId,
    memberId: preference.memberId,
    priorityInboxEnabled: preference.priorityInboxEnabled,
    emailEnabled: preference.emailEnabled,
    emailFormat: preference.emailFormat,
    emailDigestDelayLowPriority: preference.emailDigestDelayLowPriority,
    emailDigestUrgentImmediate: preference.emailDigestUrgentImmediate,
    showChangelogInSidebar: preference.showChangelogInSidebar,
    changelogNewsletter: preference.changelogNewsletter,
    marketingAndOnboarding: preference.marketingAndOnboarding,
    inviteAccepted: preference.inviteAccepted,
    privacyAndLegalUpdates: preference.privacyAndLegalUpdates,
    dataProcessingAgreement: preference.dataProcessingAgreement,
  };
}

export function createNotificationPreferencesRouter(middleware: Middleware) {
  return {
    notificationPreferences: {
      get: middleware.workspaceScoped.notificationPreferences.get.handler(async ({ context }) => {
        const preference = await getOrCreateNotificationPreferences(
          context.db,
          context.workspace.id,
          context.member.id,
        );
        if (!preference) throw new ORPCError("INTERNAL_SERVER_ERROR");

        return preferencesOutput(preference);
      }),
      update: middleware.writeScoped.notificationPreferences.update.handler(
        async ({ context, input }) => {
          const preference = await updateNotificationPreferences(
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
    notificationTypePreferences: {
      get: middleware.workspaceScoped.notificationTypePreferences.get.handler(
        async ({ context, input }) => ({
          workspaceId: context.workspace.id,
          memberId: context.member.id,
          channel: input.channel,
          items: await getOrCreateNotificationTypePreferences(
            context.db,
            context.workspace.id,
            context.member.id,
            input.channel,
          ),
        }),
      ),
      update: middleware.writeScoped.notificationTypePreferences.update.handler(
        async ({ context, input }) => ({
          workspaceId: context.workspace.id,
          memberId: context.member.id,
          channel: input.channel,
          items: await updateNotificationTypePreferences(
            context.db,
            context.workspace.id,
            context.member.id,
            input.channel,
            input.items,
          ),
        }),
      ),
    },
  };
}
