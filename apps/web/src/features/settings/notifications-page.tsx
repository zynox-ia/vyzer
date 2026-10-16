/**
 * As rotas `/settings/notifications` e `/settings/notifications/:channel`: as views ligadas à API
 * (`notificationPreferences` e `notificationTypePreferences`), com gravação otimista, volta e aviso
 * se falhar (mesmo padrão de Preferences).
 */
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, useParams } from "react-router";
import { Alert, Button, Skeleton, useToast } from "@zynox/design-system/components";
import { cn } from "@zynox/design-system/cn";
import {
  notificationPreferencesQueryOptions,
  notificationTypePreferencesQueryOptions,
  updateNotificationPreferencesMutationOptions,
  updateNotificationTypePreferencesMutationOptions,
  type NotificationPreferences,
  type NotificationTypePreferences,
} from "@/services/notification-preferences";
import { profileQueryOptions } from "@/services/profile";
import { NotificationsView, type NotificationFlags } from "./notifications";
import {
  NotificationChannelView,
  NotificationsBackLink,
  type EmailSettings,
} from "./notifications-channel";
import {
  NOTIFICATION_TYPES,
  type ChannelMatrix,
  type NotificationChannelKey,
  type NotificationTypeKey,
} from "./notifications-model";

const CHANNELS: NotificationChannelKey[] = ["priority", "desktop", "mobile", "email", "slack"];

const toMatrix = (data: NotificationTypePreferences): ChannelMatrix => {
  const matrix = Object.fromEntries(
    NOTIFICATION_TYPES.map((type) => [type.key, false]),
  ) as ChannelMatrix;
  for (const item of data.items) matrix[item.type] = item.enabled;
  return matrix;
};

function useNotificationPreferences() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const queryKey = notificationPreferencesQueryOptions().queryKey;
  const query = useQuery(notificationPreferencesQueryOptions());
  const mutation = useMutation({
    ...updateNotificationPreferencesMutationOptions(),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NotificationPreferences>(queryKey);
      if (previous) queryClient.setQueryData(queryKey, { ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast({
        title: "Could not save notification settings",
        description: "Check your connection and try again.",
        variant: "error",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
  return { query, update: mutation.mutate };
}

function useChannelMutation(channel: NotificationChannelKey) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const queryKey = notificationTypePreferencesQueryOptions(channel).queryKey;
  return useMutation({
    ...updateNotificationTypePreferencesMutationOptions(),
    onMutate: async ({ items }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<NotificationTypePreferences>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
          ...previous,
          items: previous.items.map(
            (item) => items.find((next) => next.type === item.type) ?? item,
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      toast({
        title: "Could not save notification settings",
        description: "Check your connection and try again.",
        variant: "error",
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

function Loading({ title, withBackLink }: { title: string; withBackLink?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-1", withBackLink && "pt-8")}>
      {withBackLink && <NotificationsBackLink />}
      <h1 className="type-heading-1 pb-6 text-primary">{title}</h1>
      <div aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">Loading notification settings.</span>
        {[0, 1, 2, 3, 4].map((row) => (
          <Skeleton key={row} shape="block" className="h-control-xl" />
        ))}
      </div>
    </div>
  );
}

function LoadError({
  title,
  withBackLink,
  onRetry,
}: {
  title: string;
  withBackLink?: boolean;
  onRetry: () => void;
}) {
  return (
    <div className={cn("flex flex-col gap-1", withBackLink && "pt-8")}>
      {withBackLink && <NotificationsBackLink />}
      <h1 className="type-heading-1 pb-6 text-primary">{title}</h1>
      <Alert
        tone="danger"
        role="alert"
        title="Could not load notification settings"
        action={
          <Button type="button" variant="secondary" onClick={onRetry}>
            Retry
          </Button>
        }
      >
        Check your connection and try again.
      </Alert>
    </div>
  );
}

/** `/settings/notifications`: Inbox, Push notifications e Updates. */
export function NotificationsPage() {
  const { query, update } = useNotificationPreferences();
  const matrices = useQueries({
    queries: CHANNELS.map((channel) => notificationTypePreferencesQueryOptions(channel)),
  });

  if (query.isPending || matrices.some((matrix) => matrix.isPending)) {
    return <Loading title="Notifications" />;
  }
  if (query.isError || !query.data || matrices.some((matrix) => matrix.isError || !matrix.data)) {
    return (
      <LoadError
        title="Notifications"
        onRetry={() => {
          void query.refetch();
          matrices.forEach((matrix) => void matrix.refetch());
        }}
      />
    );
  }

  const prefs = query.data;
  const flags: NotificationFlags = {
    priorityInbox: prefs.priorityInboxEnabled,
    showChangelogInSidebar: prefs.showChangelogInSidebar,
    changelogNewsletter: prefs.changelogNewsletter,
    marketingAndOnboarding: prefs.marketingAndOnboarding,
    inviteAccepted: prefs.inviteAccepted,
    privacyAndLegalUpdates: prefs.privacyAndLegalUpdates,
    dataProcessingAgreement: prefs.dataProcessingAgreement,
  };
  const channels = Object.fromEntries(
    CHANNELS.map((channel, index) => [channel, toMatrix(matrices[index]!.data!)]),
  ) as Record<NotificationChannelKey, ChannelMatrix>;

  return (
    <NotificationsView
      flags={flags}
      channels={channels}
      onFlag={({ priorityInbox, ...rest }) =>
        update({
          ...rest,
          ...(priorityInbox === undefined ? {} : { priorityInboxEnabled: priorityInbox }),
        })
      }
    />
  );
}

/** `/settings/notifications/:channel`: a lista de tipos de um canal (e os ajustes do e-mail). */
export function NotificationChannelPage() {
  const { channel } = useParams();
  const valid = CHANNELS.find((key) => key === channel);
  if (!valid) return <Navigate to="/settings/notifications" replace />;
  return <ChannelPage channel={valid} />;
}

function ChannelPage({ channel }: { channel: NotificationChannelKey }) {
  const { query: prefsQuery, update } = useNotificationPreferences();
  const typesQuery = useQuery(notificationTypePreferencesQueryOptions(channel));
  const profile = useQuery({ ...profileQueryOptions(), enabled: channel === "email" });
  const save = useChannelMutation(channel);
  const title = channel === "priority" ? "Priority notifications" : "Notifications";

  if (prefsQuery.isPending || typesQuery.isPending) {
    return <Loading title={title} withBackLink />;
  }
  if (prefsQuery.isError || typesQuery.isError || !prefsQuery.data || !typesQuery.data) {
    return (
      <LoadError
        title={title}
        withBackLink
        onRetry={() => {
          void prefsQuery.refetch();
          void typesQuery.refetch();
        }}
      />
    );
  }

  const prefs = prefsQuery.data;
  const emailSettings: EmailSettings = {
    emailEnabled: prefs.emailEnabled,
    emailFormat: prefs.emailFormat,
    emailDigestDelayLowPriority: prefs.emailDigestDelayLowPriority,
    emailDigestUrgentImmediate: prefs.emailDigestUrgentImmediate,
  };

  return (
    <NotificationChannelView
      channel={channel}
      matrix={toMatrix(typesQuery.data)}
      onToggleType={(type: NotificationTypeKey, enabled) =>
        save.mutate({ channel, items: [{ type, enabled }] })
      }
      email={profile.data?.email}
      emailSettings={emailSettings}
      onEmailSettings={update}
      priorityInbox={prefs.priorityInboxEnabled}
    />
  );
}
