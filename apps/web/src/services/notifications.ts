import type { QueryClient } from "@tanstack/react-query";
import type { NotificationListInput } from "@vyzer/contract";
import { api } from "./api";

export const notificationsQueryOptions = (input: NotificationListInput) =>
  api.notification.list.queryOptions({ input });

export const unreadNotificationsCountQueryOptions = () =>
  api.notification.unreadCount.queryOptions();

export const markNotificationsReadMutationOptions = () =>
  api.notification.markRead.mutationOptions();

export const markNotificationsUnreadMutationOptions = () =>
  api.notification.markUnread.mutationOptions();

export const archiveNotificationsMutationOptions = () => api.notification.archive.mutationOptions();

export const archiveAllNotificationsMutationOptions = () =>
  api.notification.archiveAll.mutationOptions();

/** Invalidate Inbox rows and the sidebar count after a notification mutation succeeds. */
export async function invalidateNotificationQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: api.notification.list.key() }),
    queryClient.invalidateQueries({ queryKey: api.notification.unreadCount.key() }),
  ]);
}
