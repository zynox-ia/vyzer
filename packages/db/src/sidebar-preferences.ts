import { and, asc, eq } from "drizzle-orm";
import type { Db } from "./index";
import * as schema from "./schema";

type DbSession = Pick<Db, "insert" | "select" | "update">;

export const defaultSidebarItemPreferences = [
  { itemKey: "inbox", visibility: "always", sortOrder: 0 },
  { itemKey: "reviews", visibility: "always", sortOrder: 1 },
  { itemKey: "my-issues", visibility: "always", sortOrder: 2 },
  { itemKey: "agent", visibility: "always", sortOrder: 3 },
  { itemKey: "drafts", visibility: "when-badged", sortOrder: 4 },
  { itemKey: "projects", visibility: "always", sortOrder: 0 },
  { itemKey: "views", visibility: "always", sortOrder: 1 },
  { itemKey: "members", visibility: "hidden", sortOrder: 2 },
  { itemKey: "teams", visibility: "hidden", sortOrder: 3 },
] as const satisfies ReadonlyArray<{
  itemKey: (typeof schema.sidebarItemKey.enumValues)[number];
  visibility: (typeof schema.sidebarItemVisibility.enumValues)[number];
  sortOrder: number;
}>;

export type SidebarPreferencesPatch = {
  badgeStyle?: (typeof schema.sidebarBadgeStyle.enumValues)[number];
  items?: Array<{
    itemKey: (typeof schema.sidebarItemKey.enumValues)[number];
    visibility?: (typeof schema.sidebarItemVisibility.enumValues)[number];
    sortOrder?: number;
  }>;
};

const personalItemKeys: ReadonlySet<string> = new Set([
  "inbox",
  "reviews",
  "my-issues",
  "agent",
  "drafts",
] as const);

async function ensureSidebarPreferences(
  executor: DbSession,
  workspaceId: string,
  memberId: string,
) {
  await executor
    .insert(schema.memberSidebarPreference)
    .values({ workspaceId, memberId })
    .onConflictDoNothing();

  await executor
    .insert(schema.sidebarItemPreference)
    .values(
      defaultSidebarItemPreferences.map(({ itemKey, visibility, sortOrder }) => ({
        workspaceId,
        memberId,
        itemKey,
        visibility,
        sortOrder,
      })),
    )
    .onConflictDoNothing();
}

async function readSidebarPreferences(executor: DbSession, workspaceId: string, memberId: string) {
  const [preference] = await executor
    .select()
    .from(schema.memberSidebarPreference)
    .where(
      and(
        eq(schema.memberSidebarPreference.workspaceId, workspaceId),
        eq(schema.memberSidebarPreference.memberId, memberId),
      ),
    )
    .limit(1);

  if (!preference) return null;

  const items = await executor
    .select()
    .from(schema.sidebarItemPreference)
    .where(
      and(
        eq(schema.sidebarItemPreference.workspaceId, workspaceId),
        eq(schema.sidebarItemPreference.memberId, memberId),
      ),
    )
    .orderBy(
      asc(schema.sidebarItemPreference.sortOrder),
      asc(schema.sidebarItemPreference.itemKey),
    );

  const defaultOrder = new Map(
    defaultSidebarItemPreferences.map(({ itemKey }, index) => [itemKey, index]),
  );
  items.sort((a, b) => {
    const aGroup = personalItemKeys.has(a.itemKey) ? 0 : 1;
    const bGroup = personalItemKeys.has(b.itemKey) ? 0 : 1;
    return (
      aGroup - bGroup ||
      a.sortOrder - b.sortOrder ||
      (defaultOrder.get(a.itemKey) ?? 0) - (defaultOrder.get(b.itemKey) ?? 0)
    );
  });

  return { preference, items };
}

export async function getOrCreateSidebarPreferences(db: Db, workspaceId: string, memberId: string) {
  await ensureSidebarPreferences(db, workspaceId, memberId);
  return readSidebarPreferences(db, workspaceId, memberId);
}

export async function updateSidebarPreferences(
  db: Db,
  workspaceId: string,
  memberId: string,
  values: SidebarPreferencesPatch,
) {
  return db.transaction(async (tx) => {
    await ensureSidebarPreferences(tx, workspaceId, memberId);
    const updatedAt = new Date();

    if (values.badgeStyle !== undefined) {
      await tx
        .update(schema.memberSidebarPreference)
        .set({ badgeStyle: values.badgeStyle, updatedAt })
        .where(
          and(
            eq(schema.memberSidebarPreference.workspaceId, workspaceId),
            eq(schema.memberSidebarPreference.memberId, memberId),
          ),
        );
    }

    for (const item of values.items ?? []) {
      const { itemKey, ...patch } = item;
      await tx
        .update(schema.sidebarItemPreference)
        .set({ ...patch, updatedAt })
        .where(
          and(
            eq(schema.sidebarItemPreference.workspaceId, workspaceId),
            eq(schema.sidebarItemPreference.memberId, memberId),
            eq(schema.sidebarItemPreference.itemKey, itemKey),
          ),
        );
    }

    return readSidebarPreferences(tx, workspaceId, memberId);
  });
}
