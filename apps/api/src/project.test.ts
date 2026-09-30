import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, project, resolveWorkspaceMember, team, workspace } from "@vyzer/db";
import { createRouter } from "./router";

function testDatabaseUrl(): string {
  const fromProcess = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (fromProcess) return fromProcess;

  try {
    const rootEnv = parseEnv(readFileSync(new URL("../../../.env", import.meta.url), "utf8"));
    if (rootEnv.DATABASE_URL) return rootEnv.DATABASE_URL;
  } catch {
    // CI and local runners can provide TEST_DATABASE_URL/DATABASE_URL directly.
  }

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Project tests.");
}

const db = createDb(testDatabaseUrl());
const seededApi = createRouterClient(createRouter(), { context: { db, headers: new Headers() } });
const fixtureWorkspaceIds: string[] = [];

function createWorkspaceApi(workspaceId: string, memberId: string) {
  const scopedRouter = createRouter((contextDb) =>
    resolveWorkspaceMember(contextDb, workspaceId, memberId),
  );
  return createRouterClient(scopedRouter, { context: { db, headers: new Headers() } });
}

async function createWorkspaceAndMember() {
  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const suffix = randomUUID();

  await db.insert(workspace).values({
    id: workspaceId,
    name: `Project Fixture Workspace ${suffix}`,
    slug: `project-fixture-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  fixtureWorkspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Project Fixture Member ${suffix}`,
    email: `project-${suffix}@example.test`,
    role: "admin",
  });

  return { workspaceId, memberId, api: createWorkspaceApi(workspaceId, memberId), suffix };
}

async function createMemberInWorkspace(workspaceId: string) {
  const id = randomUUID();
  const suffix = randomUUID();
  await db.insert(member).values({
    id,
    workspaceId,
    name: `Project Lead ${suffix}`,
    email: `lead-${suffix}@example.test`,
    role: "member",
  });
  return { id, name: `Project Lead ${suffix}` };
}

async function createTeam(workspaceId: string, suffix = randomUUID()) {
  const id = randomUUID();
  const name = `Project Team ${suffix}`;
  const slug = `project-team-${suffix}`;
  const key = `P${randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
  const icon = { kind: "icon" as const, name: "Layers", color: "purple" as const };

  await db.insert(team).values({
    id,
    workspaceId,
    name,
    slug,
    key,
    icon,
    issueEmailAddress: `${slug}-${randomUUID().replaceAll("-", "").slice(0, 12)}@intake.vyzer.app.br`,
  });

  return { id, name, slug, key, icon };
}

function projectInput(name: string, teamIds: string[]) {
  return {
    name,
    icon: { kind: "icon" as const, name: "Box", color: "cyan" as const },
    status: "started" as const,
    health: "none" as const,
    teamIds,
  };
}

afterEach(async () => {
  for (const workspaceId of fixtureWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "project_team" WHERE workspace_id = ${workspaceId}`;
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace-scoped Project procedures", () => {
  it("seeds the six sample Projects with their Team links and target date", async () => {
    const projects = await seededApi.project.list({});
    const projectsByName = new Map(
      projects.map((currentProject) => [currentProject.name, currentProject]),
    );

    expect(projects.map(({ name }) => name)).toEqual([
      "Aname CRM",
      "Plugga OS",
      "Mv School",
      "ZynCloud",
      "Zynox OS",
      "Teste",
    ]);
    expect(projectsByName.get("Aname CRM")?.teams.map(({ slug }) => slug)).toEqual(["zynox"]);
    expect(projectsByName.get("Teste")?.teams.map(({ slug }) => slug)).toEqual(["vyzer"]);
    expect(projectsByName.get("Zynox OS")).toMatchObject({
      healthNote: "20min",
      targetDate: "2026-12-18",
      lead: { name: "André Júnio" },
    });
  });

  it("project.list returns only current Workspace Projects and filters by teamSlug", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const otherTeam = await createTeam(current.workspaceId);
    const foreignTeam = await createTeam(foreign.workspaceId);
    const currentProject = await current.api.project.create(
      projectInput("Current Team Project", [currentTeam.id]),
    );
    const otherProject = await current.api.project.create(
      projectInput("Other Team Project", [otherTeam.id]),
    );
    const foreignProject = await foreign.api.project.create(
      projectInput("Foreign Workspace Project", [foreignTeam.id]),
    );

    const allProjects = await current.api.project.list({});
    expect(allProjects.map(({ id }) => id)).toEqual(
      expect.arrayContaining([currentProject.id, otherProject.id]),
    );
    expect(allProjects.map(({ id }) => id)).not.toContain(foreignProject.id);

    const filtered = await current.api.project.list({ teamSlug: currentTeam.slug });
    expect(filtered.map(({ id }) => id)).toEqual([currentProject.id]);
    const otherTeamProjects = await current.api.project.list({ teamSlug: otherTeam.slug });
    expect(otherTeamProjects.map(({ id }) => id)).toEqual([otherProject.id]);
    await expect(current.api.project.list({ teamSlug: foreignTeam.slug })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("project.detail returns the shared Project shape and hides missing or foreign Projects", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const foreignTeam = await createTeam(foreign.workspaceId);
    const lead = await createMemberInWorkspace(current.workspaceId);
    const localProject = await current.api.project.create({
      ...projectInput("Detailed Project", [currentTeam.id]),
      priority: "medium",
      leadMemberId: lead.id,
      targetDate: "2026-12-18",
      healthNote: "20min",
    });
    const foreignProject = await foreign.api.project.create(
      projectInput("Foreign Project", [foreignTeam.id]),
    );

    const detail = await current.api.project.detail({ id: localProject.id });
    expect(detail).toMatchObject({
      id: localProject.id,
      name: "Detailed Project",
      icon: { kind: "icon", name: "Box", color: "cyan" },
      status: "started",
      health: "none",
      healthNote: "20min",
      priority: "medium",
      lead: { id: lead.id, name: lead.name },
      targetDate: "2026-12-18",
      teams: [
        {
          id: currentTeam.id,
          name: currentTeam.name,
          slug: currentTeam.slug,
          key: currentTeam.key,
          icon: currentTeam.icon,
        },
      ],
      issues: 0,
      progress: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(detail.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(detail.updatedAt))).toBe(false);
    await expect(current.api.project.detail({ id: randomUUID() })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(current.api.project.detail({ id: foreignProject.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("project.create scopes the record to the resolved Workspace and returns defaults", async () => {
    const current = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const created = await current.api.project.create(
      projectInput("Created Project", [currentTeam.id]),
    );
    const [persisted] = await db.$client<{ workspace_id: string }[]>`
      SELECT workspace_id FROM "project" WHERE id = ${created.id}
    `;

    expect(persisted?.workspace_id).toBe(current.workspaceId);
    expect(created).toMatchObject({
      id: expect.any(String),
      name: "Created Project",
      healthNote: null,
      priority: null,
      lead: null,
      targetDate: null,
      teams: [expect.objectContaining({ id: currentTeam.id, slug: currentTeam.slug })],
      issues: 0,
      progress: 0,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    await expect(
      current.api.project.create(projectInput("Missing Team", [randomUUID()])),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(current.api.project.create(projectInput("No Teams", []))).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("allows a regular Workspace Member to create, update, and delete Projects", async () => {
    const current = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const regularMember = await createMemberInWorkspace(current.workspaceId);
    const memberApi = createWorkspaceApi(current.workspaceId, regularMember.id);

    const created = await memberApi.project.create(
      projectInput("Member Created Project", [currentTeam.id]),
    );
    const updated = await memberApi.project.update({ id: created.id, healthNote: "Updated" });

    expect(updated).toMatchObject({ id: created.id, healthNote: "Updated" });
    await expect(memberApi.project.delete({ id: created.id })).resolves.toBeUndefined();
  });

  it("project.create rejects foreign or missing lead Members without creating a Project", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);

    await expect(
      current.api.project.create({
        ...projectInput("Foreign Lead Project", [currentTeam.id]),
        leadMemberId: foreign.memberId,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      current.api.project.create({
        ...projectInput("Missing Lead Project", [currentTeam.id]),
        leadMemberId: randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const listed = await current.api.project.list({});
    expect(listed).toEqual([]);
  });

  it("the database rejects a Project lead from another Workspace", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();

    await expect(
      db.insert(project).values({
        workspaceId: current.workspaceId,
        name: "Foreign Database Lead Project",
        icon: { kind: "icon", name: "Box", color: "cyan" },
        status: "started",
        health: "none",
        leadMemberId: foreign.memberId,
      }),
    ).rejects.toMatchObject({
      cause: { code: "23503", constraint_name: "project_lead_member_workspace_fk" },
    });

    await expect(current.api.project.list({})).resolves.toEqual([]);
  });

  it("clears the Project lead when its Member is deleted", async () => {
    const current = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const lead = await createMemberInWorkspace(current.workspaceId);
    const created = await current.api.project.create({
      ...projectInput("Lead Cleanup Project", [currentTeam.id]),
      leadMemberId: lead.id,
    });

    await db.$client`DELETE FROM "member" WHERE id = ${lead.id}`;

    await expect(current.api.project.detail({ id: created.id })).resolves.toMatchObject({
      id: created.id,
      lead: null,
    });
  });

  it("project.create rejects foreign or missing Team links without creating a Project", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();
    const foreignTeam = await createTeam(foreign.workspaceId);

    await expect(
      current.api.project.create(projectInput("Foreign Team Project", [foreignTeam.id])),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      current.api.project.create(projectInput("Missing Team Project", [randomUUID()])),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    await expect(current.api.project.list({})).resolves.toEqual([]);
  });

  it("project.update changes fields and associations and clears nullable values", async () => {
    const current = await createWorkspaceAndMember();
    const firstTeam = await createTeam(current.workspaceId, current.suffix);
    const secondTeam = await createTeam(current.workspaceId);
    const lead = await createMemberInWorkspace(current.workspaceId);
    const created = await current.api.project.create({
      ...projectInput("Before Update", [firstTeam.id]),
      healthNote: "Old note",
      targetDate: "2026-10-10",
      leadMemberId: lead.id,
    });

    const updated = await current.api.project.update({
      id: created.id,
      name: "After Update",
      icon: { kind: "emoji", emoji: "🚀" },
      status: "completed",
      health: "on-track",
      healthNote: "New note",
      priority: "high",
      targetDate: "2027-01-02",
      teamIds: [secondTeam.id],
    });
    expect(updated).toMatchObject({
      id: created.id,
      name: "After Update",
      icon: { kind: "emoji", emoji: "🚀" },
      status: "completed",
      health: "on-track",
      healthNote: "New note",
      priority: "high",
      targetDate: "2027-01-02",
      lead: { id: lead.id, name: lead.name },
      teams: [expect.objectContaining({ id: secondTeam.id })],
    });

    const cleared = await current.api.project.update({
      id: created.id,
      healthNote: null,
      targetDate: null,
      leadMemberId: null,
    });
    expect(cleared).toMatchObject({ healthNote: null, targetDate: null, lead: null });
    expect((await current.api.project.detail({ id: created.id })).teams).toEqual([
      expect.objectContaining({ id: secondTeam.id }),
    ]);
  });

  it("supports a Project with multiple Teams and preserves links on a fields-only update", async () => {
    const current = await createWorkspaceAndMember();
    const firstTeam = await createTeam(current.workspaceId, current.suffix);
    const secondTeam = await createTeam(current.workspaceId);
    const created = await current.api.project.create(
      projectInput("Multiple Team Project", [firstTeam.id, secondTeam.id]),
    );

    const linkedTeamIds = created.teams.map(({ id }) => id).sort();
    expect(linkedTeamIds).toEqual([firstTeam.id, secondTeam.id].sort());
    expect(
      (await current.api.project.list({ teamSlug: firstTeam.slug })).map(({ id }) => id),
    ).toEqual([created.id]);
    expect(
      (await current.api.project.list({ teamSlug: secondTeam.slug })).map(({ id }) => id),
    ).toEqual([created.id]);

    const updated = await current.api.project.update({
      id: created.id,
      healthNote: "Still linked",
    });
    expect(updated.teams.map(({ id }) => id).sort()).toEqual(linkedTeamIds);
  });

  it("project.update rejects foreign or missing Projects without changing them", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();
    const foreignTeam = await createTeam(foreign.workspaceId);
    const project = await foreign.api.project.create(
      projectInput("Protected Project", [foreignTeam.id]),
    );

    await expect(
      current.api.project.update({ id: project.id, name: "Unauthorized Update" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      current.api.project.update({ id: randomUUID(), name: "Missing Project" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await foreign.api.project.detail({ id: project.id })).toMatchObject({
      id: project.id,
      name: "Protected Project",
      teams: [expect.objectContaining({ id: foreignTeam.id })],
    });
  });

  it("project.update rejects foreign or missing Team and lead links without changing the Project", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const foreignTeam = await createTeam(foreign.workspaceId);
    const foreignLead = await createMemberInWorkspace(foreign.workspaceId);
    const project = await current.api.project.create(
      projectInput("Stable Project", [currentTeam.id]),
    );

    await expect(
      current.api.project.update({ id: project.id, teamIds: [foreignTeam.id] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      current.api.project.update({ id: project.id, teamIds: [randomUUID()] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(current.api.project.update({ id: project.id, teamIds: [] })).rejects.toMatchObject(
      { code: "BAD_REQUEST" },
    );
    await expect(
      current.api.project.update({ id: project.id, leadMemberId: foreignLead.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      current.api.project.update({ id: project.id, leadMemberId: randomUUID() }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(await current.api.project.detail({ id: project.id })).toMatchObject({
      id: project.id,
      name: "Stable Project",
      lead: null,
      teams: [expect.objectContaining({ id: currentTeam.id })],
    });
  });

  it("project.delete removes a local Project and its associations, and hides foreign Projects", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const foreignTeam = await createTeam(foreign.workspaceId);
    const localProject = await current.api.project.create(
      projectInput("Project to Delete", [currentTeam.id]),
    );
    const foreignProject = await foreign.api.project.create(
      projectInput("Foreign Project to Keep", [foreignTeam.id]),
    );

    await expect(current.api.project.delete({ id: localProject.id })).resolves.toBeUndefined();
    await expect(current.api.project.detail({ id: localProject.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(current.api.project.delete({ id: foreignProject.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(current.api.project.delete({ id: randomUUID() })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(foreign.api.project.detail({ id: foreignProject.id })).resolves.toMatchObject({
      id: foreignProject.id,
      name: "Foreign Project to Keep",
    });
  });

  it("workspace.delete cascades through Projects and Teams without touching another Workspace", async () => {
    const current = await createWorkspaceAndMember();
    const foreign = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const foreignTeam = await createTeam(foreign.workspaceId);
    const foreignProject = await foreign.api.project.create(
      projectInput("Foreign Project to Preserve", [foreignTeam.id]),
    );
    await current.api.project.create(projectInput("Project to Cascade", [currentTeam.id]));

    await current.api.workspace.delete();

    const [remaining] = await db.$client<{ count: number }[]>`
      SELECT (
        (SELECT count(*)::int FROM "workspace" WHERE id = ${current.workspaceId}) +
        (SELECT count(*)::int FROM "project" WHERE workspace_id = ${current.workspaceId}) +
        (SELECT count(*)::int FROM "team" WHERE workspace_id = ${current.workspaceId}) +
        (SELECT count(*)::int FROM "project_team" WHERE workspace_id = ${current.workspaceId})
      ) AS count
    `;
    expect(remaining?.count).toBe(0);
    await expect(foreign.api.project.detail({ id: foreignProject.id })).resolves.toMatchObject({
      id: foreignProject.id,
      name: "Foreign Project to Preserve",
    });
  });

  it("team.delete returns CONFLICT and preserves a Team with an associated Project", async () => {
    const current = await createWorkspaceAndMember();
    const currentTeam = await createTeam(current.workspaceId, current.suffix);
    const project = await current.api.project.create(
      projectInput("Associated Project", [currentTeam.id]),
    );

    await expect(current.api.team.delete({ id: currentTeam.id })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(current.api.team.get({ team: currentTeam.slug })).resolves.toMatchObject({
      id: currentTeam.id,
      slug: currentTeam.slug,
    });
    await expect(current.api.project.detail({ id: project.id })).resolves.toMatchObject({
      id: project.id,
      teams: [expect.objectContaining({ id: currentTeam.id })],
    });
  });
});
