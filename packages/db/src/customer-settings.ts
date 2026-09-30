import { and, asc, eq, sql } from "drizzle-orm";
import type { Db } from "./index";
import { customerDomainRule, customerSettings, customerStatus, customerTier, team } from "./schema";

export const defaultCustomerStatuses = [
  { name: "Active", color: "purple" },
  { name: "Prospect", color: "green" },
  { name: "Churned", color: "red" },
  { name: "Lost", color: "orange" },
] as const;

export type CustomerSettingsPatch = Partial<
  Pick<
    typeof customerSettings.$inferInsert,
    | "enabled"
    | "defaultTeamId"
    | "revenuePeriod"
    | "revenueCurrency"
    | "attributesDataSource"
    | "manualEditsEnabled"
  >
>;

export type CustomerStatusInput = Pick<typeof customerStatus.$inferInsert, "name" | "color">;
export type CustomerStatusPatch = Partial<CustomerStatusInput>;
export type CustomerTierInput = Pick<typeof customerTier.$inferInsert, "name" | "color">;
export type CustomerTierPatch = Partial<CustomerTierInput>;

async function ensureDefaultCustomerStatuses(db: Db, workspaceId: string): Promise<void> {
  const [existingStatus] = await db
    .select({ id: customerStatus.id })
    .from(customerStatus)
    .where(eq(customerStatus.workspaceId, workspaceId))
    .limit(1);

  if (existingStatus) return;

  await db
    .insert(customerStatus)
    .values(
      defaultCustomerStatuses.map((status, position) => ({
        workspaceId,
        name: status.name,
        color: status.color,
        position,
      })),
    )
    .onConflictDoNothing();
}

export async function getOrCreateCustomerSettings(db: Db, workspaceId: string) {
  await db.insert(customerSettings).values({ workspaceId }).onConflictDoNothing();
  await ensureDefaultCustomerStatuses(db, workspaceId);

  const [row] = await db
    .select()
    .from(customerSettings)
    .where(eq(customerSettings.workspaceId, workspaceId))
    .limit(1);

  return row ?? null;
}

export async function updateCustomerSettings(
  db: Db,
  workspaceId: string,
  values: CustomerSettingsPatch,
) {
  if (values.defaultTeamId) {
    const [defaultTeam] = await db
      .select({ id: team.id })
      .from(team)
      .where(and(eq(team.id, values.defaultTeamId), eq(team.workspaceId, workspaceId)))
      .limit(1);

    if (!defaultTeam) return null;
  }

  const current = await getOrCreateCustomerSettings(db, workspaceId);
  if (!current) return null;

  const patch = Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  );
  if (Object.keys(patch).length === 0) return current;

  const [updated] = await db
    .update(customerSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(customerSettings.workspaceId, workspaceId))
    .returning();

  return updated ?? null;
}

export async function listCustomerDomainRules(
  db: Db,
  workspaceId: string,
  kind: "excluded" | "generic",
) {
  return db
    .select()
    .from(customerDomainRule)
    .where(and(eq(customerDomainRule.workspaceId, workspaceId), eq(customerDomainRule.kind, kind)))
    .orderBy(asc(customerDomainRule.value));
}

export async function addCustomerDomainRule(
  db: Db,
  workspaceId: string,
  kind: "excluded" | "generic",
  value: string,
) {
  const [created] = await db
    .insert(customerDomainRule)
    .values({ workspaceId, kind, value: value.trim().toLowerCase() })
    .returning();

  return created ?? null;
}

export async function removeCustomerDomainRule(db: Db, workspaceId: string, id: string) {
  const [removed] = await db
    .delete(customerDomainRule)
    .where(and(eq(customerDomainRule.id, id), eq(customerDomainRule.workspaceId, workspaceId)))
    .returning({ id: customerDomainRule.id });

  return removed ?? null;
}

export async function listCustomerStatuses(db: Db, workspaceId: string) {
  await ensureDefaultCustomerStatuses(db, workspaceId);

  return db
    .select()
    .from(customerStatus)
    .where(eq(customerStatus.workspaceId, workspaceId))
    .orderBy(asc(customerStatus.position), asc(customerStatus.createdAt), asc(customerStatus.id));
}

async function nextPosition(
  db: Db,
  table: typeof customerStatus | typeof customerTier,
  workspaceId: string,
) {
  const [result] = await db
    .select({ position: sql<number>`coalesce(max(${table.position}), -1)::int` })
    .from(table)
    .where(eq(table.workspaceId, workspaceId));

  return (result?.position ?? -1) + 1;
}

export async function createCustomerStatus(
  db: Db,
  workspaceId: string,
  values: CustomerStatusInput,
) {
  await ensureDefaultCustomerStatuses(db, workspaceId);

  const [created] = await db
    .insert(customerStatus)
    .values({
      ...values,
      workspaceId,
      position: await nextPosition(db, customerStatus, workspaceId),
    })
    .returning();

  return created ?? null;
}

export async function updateCustomerStatus(
  db: Db,
  workspaceId: string,
  id: string,
  values: CustomerStatusPatch,
) {
  const [updated] = await db
    .update(customerStatus)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(customerStatus.id, id), eq(customerStatus.workspaceId, workspaceId)))
    .returning();

  return updated ?? null;
}

export type DeleteCustomerStatusResult =
  | { status: "deleted" }
  | { status: "not-found" }
  | { status: "last-status" }
  | { status: "same-target" }
  | { status: "target-not-found" };

export async function deleteCustomerStatus(
  db: Db,
  workspaceId: string,
  id: string,
  moveTo?: string,
): Promise<DeleteCustomerStatusResult> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: customerStatus.id })
      .from(customerStatus)
      .where(eq(customerStatus.workspaceId, workspaceId))
      .orderBy(asc(customerStatus.id))
      .for("update");
    const current = rows.find((row) => row.id === id);

    if (!current) return { status: "not-found" };
    if (rows.length <= 1) return { status: "last-status" };
    if (moveTo === id) return { status: "same-target" };
    if (moveTo && !rows.some((row) => row.id === moveTo)) return { status: "target-not-found" };

    await tx
      .delete(customerStatus)
      .where(and(eq(customerStatus.id, id), eq(customerStatus.workspaceId, workspaceId)));

    return { status: "deleted" };
  });
}

async function reorderRows(
  db: Db,
  table: typeof customerStatus | typeof customerTier,
  workspaceId: string,
  ids: string[],
): Promise<boolean> {
  return db.transaction(async (tx) => {
    const rows = await tx
      .select({ id: table.id })
      .from(table)
      .where(eq(table.workspaceId, workspaceId))
      .orderBy(asc(table.id))
      .for("update");
    const currentIds = new Set(rows.map(({ id }) => id));

    if (ids.length !== rows.length || ids.some((id) => !currentIds.has(id))) return false;

    for (const [position, id] of ids.entries()) {
      await tx
        .update(table)
        .set({ position, updatedAt: new Date() })
        .where(and(eq(table.id, id), eq(table.workspaceId, workspaceId)));
    }

    return true;
  });
}

export async function reorderCustomerStatuses(db: Db, workspaceId: string, ids: string[]) {
  await ensureDefaultCustomerStatuses(db, workspaceId);
  return reorderRows(db, customerStatus, workspaceId, ids);
}

export async function listCustomerTiers(db: Db, workspaceId: string) {
  return db
    .select()
    .from(customerTier)
    .where(eq(customerTier.workspaceId, workspaceId))
    .orderBy(asc(customerTier.position), asc(customerTier.createdAt), asc(customerTier.id));
}

export async function createCustomerTier(db: Db, workspaceId: string, values: CustomerTierInput) {
  const [created] = await db
    .insert(customerTier)
    .values({ ...values, workspaceId, position: await nextPosition(db, customerTier, workspaceId) })
    .returning();

  return created ?? null;
}

export async function updateCustomerTier(
  db: Db,
  workspaceId: string,
  id: string,
  values: CustomerTierPatch,
) {
  const [updated] = await db
    .update(customerTier)
    .set({ ...values, updatedAt: new Date() })
    .where(and(eq(customerTier.id, id), eq(customerTier.workspaceId, workspaceId)))
    .returning();

  return updated ?? null;
}

export async function deleteCustomerTier(db: Db, workspaceId: string, id: string) {
  const [removed] = await db
    .delete(customerTier)
    .where(and(eq(customerTier.id, id), eq(customerTier.workspaceId, workspaceId)))
    .returning({ id: customerTier.id });

  return removed ?? null;
}

export async function reorderCustomerTiers(db: Db, workspaceId: string, ids: string[]) {
  return reorderRows(db, customerTier, workspaceId, ids);
}
