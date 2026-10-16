/**
 * Modelo de Settings → Notifications (spec `notifications-settings.md`; textos do Linear ao vivo,
 * 30/09): os 14 tipos de notificação, os canais e o resumo de cada canal ("Enabled for assignments,
 * status changes, 11 others"). Só dados e funções puras; as telas e a API usam os mesmos nomes.
 */
import { Hash, Mail, Monitor, Smartphone, type LucideIcon } from "lucide-react";

export type NotificationTypeKey =
  | "assignments"
  | "status-changes"
  | "comments-and-replies"
  | "mentions"
  | "reactions"
  | "subscriptions"
  | "document-changes"
  | "updates"
  | "reminders-and-deadlines"
  | "loops"
  | "apps-and-integrations"
  | "billing"
  | "reviews"
  | "triage";

export type NotificationChannelKey = "priority" | "desktop" | "mobile" | "email" | "slack";

export type NotificationTypeInfo = {
  key: NotificationTypeKey;
  label: string;
  description: string;
  group: "general" | "feature";
};

export const NOTIFICATION_TYPES: NotificationTypeInfo[] = [
  {
    key: "assignments",
    label: "Assignments",
    description: "Assignments, unassignments, and membership changes",
    group: "general",
  },
  {
    key: "status-changes",
    label: "Status changes",
    description: "Changes to the status, priority, and blocking relationships of issues",
    group: "general",
  },
  {
    key: "comments-and-replies",
    label: "Comments and replies",
    description: "Comments, replies, and thread resolutions",
    group: "general",
  },
  {
    key: "mentions",
    label: "Mentions",
    description: "Mentions in comments or content",
    group: "general",
  },
  {
    key: "reactions",
    label: "Reactions",
    description: "Emoji reactions to your content",
    group: "general",
  },
  {
    key: "subscriptions",
    label: "Subscriptions",
    description: "Issues, projects, initiatives, teams, and views you're subscribed to",
    group: "general",
  },
  {
    key: "document-changes",
    label: "Document changes",
    description: "Changes to document content, location, and subscriptions",
    group: "general",
  },
  {
    key: "updates",
    label: "Updates",
    description: "New project & initiative updates and reminders to post an update",
    group: "general",
  },
  {
    key: "reminders-and-deadlines",
    label: "Reminders and deadlines",
    description: "Reminders, due dates, and SLA updates",
    group: "general",
  },
  {
    key: "loops",
    label: "Loops",
    description: "Messages, responses, and failures from loops",
    group: "general",
  },
  {
    key: "apps-and-integrations",
    label: "Apps and integrations",
    description: "Requests related to OAuth apps and integrations",
    group: "general",
  },
  {
    key: "billing",
    label: "Billing",
    description: "Usage credit balance alerts",
    group: "general",
  },
  {
    key: "reviews",
    label: "Reviews",
    description: "Activity in reviews, including mentions and comments",
    group: "feature",
  },
  {
    key: "triage",
    label: "Triage",
    description: "Issues added to triage",
    group: "feature",
  },
];

export type ChannelMatrix = Record<NotificationTypeKey, boolean>;

export type ChannelInfo = {
  key: Exclude<NotificationChannelKey, "priority">;
  title: string;
  icon: LucideIcon;
};

/** Os canais da seção "Push notifications", na ordem do Linear. */
export const PUSH_CHANNELS: ChannelInfo[] = [
  { key: "desktop", title: "Desktop", icon: Monitor },
  { key: "mobile", title: "Mobile", icon: Smartphone },
  { key: "email", title: "Email", icon: Mail },
  { key: "slack", title: "Slack", icon: Hash },
];

/**
 * Resumo de um canal, como o Linear: "Disabled", "Enabled for all notifications" ou os dois
 * primeiros tipos ligados e quantos mais ("Enabled for assignments, status changes, 11 others").
 */
export function summarizeChannel(matrix: ChannelMatrix): string {
  const enabled = NOTIFICATION_TYPES.filter((type) => matrix[type.key]);
  if (enabled.length === 0) return "Disabled";
  if (enabled.length === NOTIFICATION_TYPES.length) return "Enabled for all notifications";
  const names = enabled.slice(0, 2).map((type) => type.label.toLowerCase());
  const others = enabled.length - names.length;
  return `Enabled for ${[...names, ...(others > 0 ? [`${others} ${others === 1 ? "other" : "others"}`] : [])].join(", ")}`;
}

/** "11 types" do link Priority notifications. */
export function countEnabled(matrix: ChannelMatrix) {
  return NOTIFICATION_TYPES.filter((type) => matrix[type.key]).length;
}
