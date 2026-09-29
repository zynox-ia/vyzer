import type { Db } from "./index";
import { ne, or } from "drizzle-orm";
import { member, workspace } from "./schema";

/** Stable identifiers used while authentication is deferred (ADR-0015). */
export const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";
export const MEMBER_ID = "00000000-0000-4000-8000-000000000002";
export const WORKSPACE_REGION = "United States";

/** Seed the single local Workspace and its owner. Re-running this is safe. */
export async function seedWorkspace(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .insert(workspace)
      .values({
        id: WORKSPACE_ID,
        name: "Zynox",
        slug: "zynox-dev",
        fiscalYearStartMonth: 1,
      })
      .onConflictDoUpdate({
        target: workspace.id,
        set: {
          name: "Zynox",
          slug: "zynox-dev",
          fiscalYearStartMonth: 1,
          updatedAt: new Date(),
        },
        setWhere: or(
          ne(workspace.name, "Zynox"),
          ne(workspace.slug, "zynox-dev"),
          ne(workspace.fiscalYearStartMonth, 1),
        ),
      });

    await tx
      .insert(member)
      .values({
        id: MEMBER_ID,
        workspaceId: WORKSPACE_ID,
        name: "André Júnio",
        email: "andrejunio.dev@gmail.com",
        role: "admin",
      })
      .onConflictDoUpdate({
        target: member.id,
        set: {
          workspaceId: WORKSPACE_ID,
          name: "André Júnio",
          email: "andrejunio.dev@gmail.com",
          role: "admin",
        },
      });
  });
}
