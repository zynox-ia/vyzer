import type { Db } from "./index";
import { ne, or } from "drizzle-orm";
import { member, project, projectTeam, team, teamMember, workspace } from "./schema";
import { createTeamIssueEmailAddress } from "./team-issue-email";

/** Stable identifiers used while authentication is deferred (ADR-0015). */
export const WORKSPACE_ID = "00000000-0000-4000-8000-000000000001";
export const MEMBER_ID = "00000000-0000-4000-8000-000000000002";
export const ZYNOX_TEAM_ID = "00000000-0000-4000-8000-000000000003";
export const VYZER_TEAM_ID = "00000000-0000-4000-8000-000000000004";
export const ANAME_CRM_PROJECT_ID = "00000000-0000-4000-8000-000000000011";
export const PLUGGA_OS_PROJECT_ID = "00000000-0000-4000-8000-000000000012";
export const MV_SCHOOL_PROJECT_ID = "00000000-0000-4000-8000-000000000013";
export const ZYNCLOUD_PROJECT_ID = "00000000-0000-4000-8000-000000000014";
export const ZYNOX_OS_PROJECT_ID = "00000000-0000-4000-8000-000000000015";
export const TESTE_PROJECT_ID = "00000000-0000-4000-8000-000000000016";
export const WORKSPACE_REGION = "United States";

/** Seed the Workspace, owner, Teams and sample Projects. Re-running this is safe. */
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
          timezone: "America/Sao_Paulo",
          estimation: "none",
          detailedIssueHistory: false,
          issueEmailEnabled: false,
          issueEmailAddress: createTeamIssueEmailAddress("zynox"),
        },
        {
          id: VYZER_TEAM_ID,
          workspaceId: WORKSPACE_ID,
          name: "Vyzer",
          slug: "vyzer",
          key: "VYZ",
          icon: { kind: "icon", name: "Layers", color: "purple" },
          timezone: "America/Sao_Paulo",
          estimation: "none",
          detailedIssueHistory: false,
          issueEmailEnabled: false,
          issueEmailAddress: createTeamIssueEmailAddress("vyzer"),
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

    await tx
      .insert(project)
      .values([
        {
          id: ANAME_CRM_PROJECT_ID,
          workspaceId: WORKSPACE_ID,
          name: "Aname CRM",
          icon: { kind: "icon", name: "Box", color: "grey" },
          status: "started",
          health: "none",
          priority: "medium",
        },
        {
          id: PLUGGA_OS_PROJECT_ID,
          workspaceId: WORKSPACE_ID,
          name: "Plugga OS",
          icon: { kind: "icon", name: "Box", color: "green" },
          status: "started",
          health: "off-track",
          healthNote: "2w",
        },
        {
          id: MV_SCHOOL_PROJECT_ID,
          workspaceId: WORKSPACE_ID,
          name: "Mv School",
          icon: { kind: "icon", name: "Box", color: "amber" },
          status: "started",
          health: "none",
        },
        {
          id: ZYNCLOUD_PROJECT_ID,
          workspaceId: WORKSPACE_ID,
          name: "ZynCloud",
          icon: { kind: "icon", name: "Box", color: "cyan" },
          status: "started",
          health: "none",
        },
        {
          id: ZYNOX_OS_PROJECT_ID,
          workspaceId: WORKSPACE_ID,
          name: "Zynox OS",
          icon: { kind: "icon", name: "Box", color: "red" },
          status: "started",
          health: "on-track",
          healthNote: "20min",
          priority: "medium",
          leadMemberId: MEMBER_ID,
          targetDate: "2026-12-18",
        },
        {
          id: TESTE_PROJECT_ID,
          workspaceId: WORKSPACE_ID,
          name: "Teste",
          icon: { kind: "icon", name: "Box", color: "purple" },
          status: "backlog",
          health: "none",
        },
      ])
      .onConflictDoNothing({ target: project.id });

    await tx
      .insert(projectTeam)
      .values([
        { projectId: ANAME_CRM_PROJECT_ID, teamId: ZYNOX_TEAM_ID, workspaceId: WORKSPACE_ID },
        { projectId: PLUGGA_OS_PROJECT_ID, teamId: ZYNOX_TEAM_ID, workspaceId: WORKSPACE_ID },
        { projectId: MV_SCHOOL_PROJECT_ID, teamId: ZYNOX_TEAM_ID, workspaceId: WORKSPACE_ID },
        { projectId: ZYNCLOUD_PROJECT_ID, teamId: ZYNOX_TEAM_ID, workspaceId: WORKSPACE_ID },
        { projectId: ZYNOX_OS_PROJECT_ID, teamId: ZYNOX_TEAM_ID, workspaceId: WORKSPACE_ID },
        { projectId: TESTE_PROJECT_ID, teamId: VYZER_TEAM_ID, workspaceId: WORKSPACE_ID },
      ])
      .onConflictDoNothing();
  });
}
