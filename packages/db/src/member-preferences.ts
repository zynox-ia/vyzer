import { and, eq } from "drizzle-orm";
import type { Db } from "./index";
import * as schema from "./schema";

type DbSession = Pick<Db, "insert" | "select" | "update">;

export type MemberPreferencesPatch = Partial<
  Omit<
    typeof schema.memberPreference.$inferInsert,
    "id" | "workspaceId" | "memberId" | "createdAt" | "updatedAt"
  >
>;

async function ensureMemberPreference(executor: DbSession, workspaceId: string, memberId: string) {
  await executor
    .insert(schema.memberPreference)
    .values({ workspaceId, memberId })
    .onConflictDoNothing();
}

async function readMemberPreference(executor: DbSession, workspaceId: string, memberId: string) {
  const [preference] = await executor
    .select()
    .from(schema.memberPreference)
    .where(
      and(
        eq(schema.memberPreference.workspaceId, workspaceId),
        eq(schema.memberPreference.memberId, memberId),
      ),
    )
    .limit(1);

  return preference ?? null;
}

export async function getOrCreateMemberPreferences(db: Db, workspaceId: string, memberId: string) {
  await ensureMemberPreference(db, workspaceId, memberId);
  return readMemberPreference(db, workspaceId, memberId);
}

export async function updateMemberPreferences(
  db: Db,
  workspaceId: string,
  memberId: string,
  values: MemberPreferencesPatch,
) {
  return db.transaction(async (tx) => {
    await ensureMemberPreference(tx, workspaceId, memberId);
    await tx
      .update(schema.memberPreference)
      .set({ ...values, updatedAt: new Date() })
      .where(
        and(
          eq(schema.memberPreference.workspaceId, workspaceId),
          eq(schema.memberPreference.memberId, memberId),
        ),
      );

    return readMemberPreference(tx, workspaceId, memberId);
  });
}
