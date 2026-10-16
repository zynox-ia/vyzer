/**
 * Mutações da Inbox, otimistas no cache do TanStack Query: a lista e o contador mudam na hora e
 * voltam ao estado anterior, com um aviso, se a API recusar (spec, "Comportamento transversal").
 */
import { useMutation, useQueryClient, type UseMutationOptions } from "@tanstack/react-query";
import type { Notification, NotificationListInput } from "@zynox/contract";
import { useToast } from "@zynox/design-system/components";
import {
  archiveAllNotificationsMutationOptions,
  archiveNotificationsMutationOptions,
  invalidateNotificationQueries,
  markNotificationsReadMutationOptions,
  markNotificationsUnreadMutationOptions,
  notificationsQueryOptions,
  unreadNotificationsCountQueryOptions,
} from "@/services/notifications";

/** A Inbox carrega a lista inteira de uma vez (o máximo do contrato); filtros vivem no cliente. */
export const INBOX_LIST_INPUT = { limit: 100 } satisfies NotificationListInput;

type ListData = { items: Notification[]; nextCursor: { id: string; createdAt: string } | null };

const unreadIn = (items: Notification[]) => items.filter((item) => item.readAt === null).length;

function useOptimisticMutation<TVariables>(
  options: UseMutationOptions<unknown, Error, TVariables>,
  patch: (items: Notification[], variables: TVariables) => Notification[],
  errorTitle: string,
) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const listKey = notificationsQueryOptions(INBOX_LIST_INPUT).queryKey;
  const countKey = unreadNotificationsCountQueryOptions().queryKey;

  return useMutation({
    ...options,
    onMutate: async (variables: TVariables) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: listKey }),
        queryClient.cancelQueries({ queryKey: countKey }),
      ]);
      const previousList = queryClient.getQueryData<ListData>(listKey);
      const previousCount = queryClient.getQueryData<number>(countKey);
      if (previousList) {
        const items = patch(previousList.items, variables);
        queryClient.setQueryData<ListData>(listKey, { ...previousList, items });
        if (previousCount !== undefined) {
          const delta = unreadIn(items) - unreadIn(previousList.items);
          queryClient.setQueryData<number>(countKey, Math.max(0, previousCount + delta));
        }
      }
      return { previousList, previousCount };
    },
    onError: (_error, _variables, context) => {
      const previous = context as { previousList?: ListData; previousCount?: number } | undefined;
      if (previous?.previousList) queryClient.setQueryData(listKey, previous.previousList);
      if (previous?.previousCount !== undefined) {
        queryClient.setQueryData(countKey, previous.previousCount);
      }
      toast({ title: errorTitle, variant: "error" });
    },
    onSettled: () => invalidateNotificationQueries(queryClient),
  });
}

export function useNotificationMutations() {
  const markRead = useOptimisticMutation<{ ids: string[] }>(
    markNotificationsReadMutationOptions() as UseMutationOptions<unknown, Error, { ids: string[] }>,
    (items, { ids }) =>
      items.map((item) =>
        ids.includes(item.id) && item.readAt === null
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
    "Could not mark as read",
  );
  const markUnread = useOptimisticMutation<{ ids: string[] }>(
    markNotificationsUnreadMutationOptions() as UseMutationOptions<
      unknown,
      Error,
      { ids: string[] }
    >,
    (items, { ids }) =>
      items.map((item) => (ids.includes(item.id) ? { ...item, readAt: null } : item)),
    "Could not mark as unread",
  );
  const archive = useOptimisticMutation<{ ids: string[] }>(
    archiveNotificationsMutationOptions() as UseMutationOptions<unknown, Error, { ids: string[] }>,
    (items, { ids }) => items.filter((item) => !ids.includes(item.id)),
    "Could not delete notification",
  );
  const archiveAll = useOptimisticMutation<{ onlyRead?: boolean }>(
    archiveAllNotificationsMutationOptions() as UseMutationOptions<
      unknown,
      Error,
      { onlyRead?: boolean }
    >,
    (items, { onlyRead }) => (onlyRead ? items.filter((item) => item.readAt === null) : []),
    "Could not delete notifications",
  );
  return { markRead, markUnread, archive, archiveAll };
}
