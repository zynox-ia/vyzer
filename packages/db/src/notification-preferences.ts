import { and, eq, sql } from "drizzle-orm";
import type { Db } from "./index";
import * as schema from "./schema";

type DbSession = Pick<Db, "insert" | "select" | "update">;

export type NotificationPreferencesPatch = Partial<
  Omit<
    typeof schema.notificationPreference.$inferInsert,
    "id" | "workspaceId" | "memberId" | "createdAt" | "updatedAt"
  >
>;

export type NotificationTypePreferenceValue = {
  type: schema.NotificationPreferenceType;
  enabled: boolean;
};

export const notificationPreferenceTypes = schema.notificationPreferenceType.enumValues;
export const notificationPreferenceChannels = schema.notificationPreferenceChannel.enumValues;

const enabledByDefault: Record<
  schema.NotificationPreferenceChannel,
  (type: schema.NotificationPreferenceType) => boolean
> = {
  priority: (type) => type === "assignments",
  desktop: (type) => type !== "reactions",
  mobile: (type) => type !== "reactions",
  email: () => true,
  slack: () => false,
};

export function getDefaultNotificationTypePreference(
  channel: schema.NotificationPreferenceChannel,
  type: schema.NotificationPreferenceType,
): boolean {
  return enabledByDefault[channel](type);
}

async function ensureNotificationPreferences(
  executor: DbSession,
  workspaceId: string,
  memberId: string,
) {
  await executor
    .insert(schema.notificationPreference)
    .values({ workspaceId, memberId })
    .onConflictDoNothing();
}

async function readNotificationPreferences(
  executor: DbSession,
  workspaceId: string,
  memberId: string,
) {
  const [preference] = await executor
    .select()
    .from(schema.notificationPreference)
    .where(
      and(
        eq(schema.notificationPreference.workspaceId, workspaceId),
        eq(schema.notificationPreference.memberId, memberId),
      ),
    )
    .limit(1);

  return preference ?? null;
}

export async function getOrCreateNotificationPreferences(
  db: Db,
  workspaceId: string,
  memberId: string,
) {
  await ensureNotificationPreferences(db, workspaceId, memberId);
  return readNotificationPreferences(db, workspaceId, memberId);
}

export async function updateNotificationPreferences(
  db: Db,
  workspaceId: string,
  memberId: string,
  values: NotificationPreferencesPatch,
) {
  return db.transaction(async (tx) => {
    await ensureNotificationPreferences(tx, workspaceId, memberId);
    await tx
      .update(schema.notificationPreference)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(schema.notificationPreference.workspaceId, workspaceId),
          eq(schema.notificationPreference.memberId, memberId),
        ),
      );

    return readNotificationPreferences(tx, workspaceId, memberId);
  });
}

async function ensureNotificationTypePreferences(
  executor: DbSession,
  workspaceId: string,
  memberId: string,
  channel: schema.NotificationPreferenceChannel,
) {
  await executor
    .insert(schema.notificationTypePreference)
    .values(
      notificationPreferenceTypes.map((type) => ({
        workspaceId,
        memberId,
        channel,
        type,
        enabled: getDefaultNotificationTypePreference(channel, type),
      })),
    )
    .onConflictDoNothing();
}

async function readNotificationTypePreferences(
  executor: DbSession,
  workspaceId: string,
  memberId: string,
  channel: schema.NotificationPreferenceChannel,
) {
  const rows = await executor
    .select()
    .from(schema.notificationTypePreference)
    .where(
      and(
        eq(schema.notificationTypePreference.workspaceId, workspaceId),
        eq(schema.notificationTypePreference.memberId, memberId),
        eq(schema.notificationTypePreference.channel, channel),
      ),
    );

  const enabledByType = new Map(rows.map(({ type, enabled }) => [type, enabled]));
  return notificationPreferenceTypes.map((type) => ({
    type,
    enabled: enabledByType.get(type) ?? getDefaultNotificationTypePreference(channel, type),
  }));
}

export async function getOrCreateNotificationTypePreferences(
  db: Db,
  workspaceId: string,
  memberId: string,
  channel: schema.NotificationPreferenceChannel,
) {
  await ensureNotificationTypePreferences(db, workspaceId, memberId, channel);
  return readNotificationTypePreferences(db, workspaceId, memberId, channel);
}

export async function getAssignmentPriorityPreference(
  db: DbSession,
  workspaceId: string,
  memberId: string,
): Promise<boolean> {
  const [preference] = await db
    .select({ enabled: schema.notificationTypePreference.enabled })
    .from(schema.notificationTypePreference)
    .where(
      and(
        eq(schema.notificationTypePreference.workspaceId, workspaceId),
        eq(schema.notificationTypePreference.memberId, memberId),
        eq(schema.notificationTypePreference.channel, "priority"),
        eq(schema.notificationTypePreference.type, "assignments"),
      ),
    )
    .limit(1);

  return preference?.enabled ?? getDefaultNotificationTypePreference("priority", "assignments");
}

export async function updateNotificationTypePreferences(
  db: Db,
  workspaceId: string,
  memberId: string,
  channel: schema.NotificationPreferenceChannel,
  values: NotificationTypePreferenceValue[],
) {
  return db.transaction(async (tx) => {
    await ensureNotificationTypePreferences(tx, workspaceId, memberId, channel);
    await tx
      .insert(schema.notificationTypePreference)
      .values(
        values.map(({ type, enabled }) => ({ workspaceId, memberId, channel, type, enabled })),
      )
      .onConflictDoUpdate({
        target: [
          schema.notificationTypePreference.memberId,
          schema.notificationTypePreference.channel,
          schema.notificationTypePreference.type,
        ],
        set: { enabled: sql`excluded."enabled"`, updatedAt: new Date() },
      });

    return readNotificationTypePreferences(tx, workspaceId, memberId, channel);
  });
}
