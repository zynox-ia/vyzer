/** Mapeamento entre o contrato de notificações e as peças do design system (só apresentação). */
import { Bell } from "lucide-react";
import type { Notification } from "@zynox/contract";
import { notificationTypeMetadata } from "@zynox/contract";
import type { NotificationRowProps } from "@zynox/design-system/components";
import { PriorityIcon, StatusIcon, type Priority } from "@zynox/design-system/icons";

/** Prioridade do contrato (0 a 4) para o ícone e o rótulo do design system. */
export const PRIORITY_BY_VALUE: Record<number, { priority: Priority; label: string }> = {
  0: { priority: "none", label: "No priority" },
  1: { priority: "urgent", label: "Urgent" },
  2: { priority: "high", label: "High" },
  3: { priority: "medium", label: "Medium" },
  4: { priority: "low", label: "Low" },
};

type NotificationIssue = NonNullable<Notification["issue"]>;

export function statusValue(status: NonNullable<NotificationIssue["status"]>) {
  return {
    label: status.name,
    icon: <StatusIcon type={status.category} color={status.color} />,
  };
}

export function priorityValue(value: number) {
  const item = PRIORITY_BY_VALUE[value] ?? PRIORITY_BY_VALUE[0]!;
  return { label: item.label, icon: <PriorityIcon priority={item.priority} /> };
}

/** Tempo relativo curto (5m, 3h, 2d, 3w, 2mo, 1y), como a Inbox do Linear. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  return `${Math.floor(days / 365)}y`;
}

/** Props da Notification Row para uma notificação. Só a prioridade Urgent aparece (Linear). */
export function notificationRowProps(
  notification: Notification,
): Omit<NotificationRowProps, "value" | "unread"> {
  const { issue, actor, type } = notification;
  return {
    actor: actor ? { name: actor.name } : { name: "Zynox", icon: Bell },
    identifier: issue?.identifier ?? "",
    title: issue?.title ?? "Notification",
    priority: issue && issue.priority === 1 ? priorityValue(issue.priority) : undefined,
    status: issue?.status ? statusValue(issue.status) : undefined,
    summary: notificationTypeMetadata[type].summary,
    time: formatRelativeTime(notification.createdAt),
    dateTime: notification.createdAt,
  };
}
