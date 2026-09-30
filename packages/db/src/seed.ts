import type { Db } from "./index";
import { ne, or } from "drizzle-orm";
import { member, team, teamMember, workspace } from "./schema";
import {
  seedTeamWorkflowStatuses,
  VYZER_WORKFLOW_STATUSES,
  ZYNOX_WORKFLOW_STATUSES,
} from "./workflow-status";

/** Stable identifiers used while authentication is deferred (ADR-0015). */
export const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";
export const MEMBER_ID = "00000000-0000-4000-8000-000000000002";
export const ZYNOX_TEAM_ID = "00000000-0000-4000-8000-000000000003";
export const VYZER_TEAM_ID = "00000000-0000-4000-8000-000000000004";
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

    await tx
      .insert(team)
      .values([
        {
          id: ZYNOX_TEAM_ID,
          workspaceId: WORKSPACE_ID,
          name: "Zynox",
          slug: "zynox",
          key: "ZYN",
          icon: { kind: "icon", name: "Navigation", color: "cyan" },
        },
        {
          id: VYZER_TEAM_ID,
          workspaceId: WORKSPACE_ID,
          name: "Vyzer",
          slug: "vyzer",
          key: "VYZ",
          icon: { kind: "icon", name: "Layers", color: "purple" },
        },
      ])
      .onConflictDoNothing({ target: team.id });

    await tx
      .insert(teamMember)
      .values([
        { teamId: ZYNOX_TEAM_ID, memberId: MEMBER_ID },
        { teamId: VYZER_TEAM_ID, memberId: MEMBER_ID },
      ])
      .onConflictDoNothing();

    await seedTeamWorkflowStatuses(tx, ZYNOX_TEAM_ID, ZYNOX_WORKFLOW_STATUSES);
    await seedTeamWorkflowStatuses(tx, VYZER_TEAM_ID, VYZER_WORKFLOW_STATUSES);
  });
}
