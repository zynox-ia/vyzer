import type { ApiClient, NotificationPreferenceChannel } from "@zynox/contract";
import { api } from "./api";

/** Flags e ajustes de e-mail do Member (Settings → Notifications, spec notifications-settings). */
export type NotificationPreferences = Awaited<
  ReturnType<ApiClient["notificationPreferences"]["get"]>
>;

/** A matriz de um canal: um item por tipo de notificação. */
export type NotificationTypePreferences = Awaited<
  ReturnType<ApiClient["notificationTypePreferences"]["get"]>
>;

export const notificationPreferencesQueryOptions = () =>
  api.notificationPreferences.get.queryOptions();

export const updateNotificationPreferencesMutationOptions = () =>
  api.notificationPreferences.update.mutationOptions();

export const notificationTypePreferencesQueryOptions = (channel: NotificationPreferenceChannel) =>
  api.notificationTypePreferences.get.queryOptions({ input: { channel } });

export const updateNotificationTypePreferencesMutationOptions = () =>
  api.notificationTypePreferences.update.mutationOptions();
