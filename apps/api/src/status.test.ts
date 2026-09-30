import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import {
  createDb,
  member,
  resolveWorkspaceMember,
  team,
  workflowStatus,
  workspace,
  VYZER_TEAM_ID,
  ZYNOX_TEAM_ID,
} from "@vyzer/db";
import { createRouter, router } from "./router";

function testDatabaseUrl(): string {
  const fromProcess = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (fromProcess) return fromProcess;

  try {
    const rootEnv = parseEnv(readFileSync(new URL("../../../.env", import.meta.url), "utf8"));
    if (rootEnv.DATABASE_URL) return rootEnv.DATABASE_URL;
  } catch {
    // CI and local runners can provide TEST_DATABASE_URL/DATABASE_URL directly.
  }

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Status tests.");
}

const db = createDb(testDatabaseUrl());
const api = createRouterClient(router, { context: { db, headers: new Headers() } });
const foreignWorkspaceIds: string[] = [];
const fixtureTeamIds: string[] = [];

/** The seven default Statuses `team.create` must seed, in Linear's category order. */
const DEFAULT_STATUS_SEED = [
  { name: "Backlog", category: "backlog" },
  { name: "Todo", category: "unstarted" },
  { name: "In Progress", category: "started" },
  { name: "In Review", category: "started" },
  { name: "Done", category: "completed" },
  { name: "Canceled", category: "canceled" },
  { name: "Duplicate", category: "duplicate" },
];

function uniqueTeamKey(): string {
  return `T${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function createWorkspaceApi(workspaceId: string, memberId: string) {
  const scopedRouter = createRouter((contextDb) =>
    resolveWorkspaceMember(contextDb, workspaceId, memberId),
  );
  return createRouterClient(scopedRouter, { context: { db, headers: new Headers() } });
}

async function createWorkspaceAndMember(role: "admin" | "member" = "admin") {
  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const suffix = randomUUID();

  await db.insert(workspace).values({
    id: workspaceId,
    name: `Fixture Workspace ${suffix}`,
    slug: `fixture-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  foreignWorkspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Fixture Member ${suffix}`,
    email: `${suffix}@example.test`,
    role,
  });

  return { workspaceId, memberId };
}

async function createMemberInWorkspace(workspaceId: string, role: "admin" | "member" = "member") {
  const id = randomUUID();
  const suffix = randomUUID();

  await db.insert(member).values({
    id,
    workspaceId,
    name: `Fixture Member ${suffix}`,
    email: `${suffix}@example.test`,
    role,
  });
  return { id, role };
}

/** Create a Team directly (bypassing `team.create`) with no seeded Statuses. */
async function createTeamWithoutStatuses(workspaceId: string) {
  const id = randomUUID();
  const suffix = randomUUID();

  await db.insert(team).values({
    id,
    workspaceId,
    name: `Fixture Team ${suffix}`,
    slug: `fixture-team-${suffix}`,
    key: uniqueTeamKey(),
    icon: { kind: "icon", name: "Layers", color: "purple" },
  });

  return { id, slug: `fixture-team-${suffix}` };
}

type StatusRow = { id: string; name: string; category: string; position: number };

/** Linear's canonical category order (Triage precedes Backlog only when the Team enables it). */
const CATEGORY_ORDER = [
  "triage",
  "backlog",
  "unstarted",
  "started",
  "completed",
  "canceled",
  "duplicate",
];

async function statusRowsForTeam(teamId: string) {
  const rows = await db.$client<StatusRow[]>`
    SELECT id, name, category, position FROM "workflow_status" WHERE team_id = ${teamId}
  `;
  return rows.sort((a, b) => {
    const categoryDelta = CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    return categoryDelta !== 0 ? categoryDelta : a.position - b.position;
  });
}

function getStatus(rows: StatusRow[], name: string): StatusRow {
  const found = rows.find((row) => row.name === name);
  if (!found) throw new Error(`Fixture Status "${name}" was not seeded.`);
  return found;
}

afterEach(async () => {
  for (const teamId of fixtureTeamIds.splice(0)) {
    await db.$client`DELETE FROM "team" WHERE id = ${teamId}`;
  }
  for (const workspaceId of foreignWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace-scoped Status procedures", () => {
  it("team.create seeds the seven default Statuses with Backlog as the Team default", async () => {
    const created = await api.team.create({
      name: `Workflow Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    fixtureTeamIds.push(created.id);

    const seeded = await statusRowsForTeam(created.id);
    expect(seeded).toHaveLength(7);
    expect(seeded.map(({ name, category }) => ({ name, category }))).toEqual(DEFAULT_STATUS_SEED);

    const backlogStatus = seeded.find(({ name }) => name === "Backlog");
    const [persistedTeam] = await db.$client<{ default_status_id: string | null }[]>`
      SELECT default_status_id FROM "team" WHERE id = ${created.id}
    `;
    expect(persistedTeam?.default_status_id).toBe(backlogStatus?.id);
  });

  it("status.list returns a Team's Statuses in category order and hides a foreign Team", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `List Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });

    const listed: { name: string }[] = await foreignApi.status.list({ team: created.slug });
    expect(listed.map((status) => status.name)).toEqual(
      DEFAULT_STATUS_SEED.map(({ name }) => name),
    );

    await expect(api.status.list({ team: created.slug })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("status.create persists a new Status and rejects a duplicate name in the same Team", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Create Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });

    const newStatus = await foreignApi.status.create({
      team: created.slug,
      category: "started",
      name: "Verifying",
      description: "QA is verifying the fix",
    });
    expect(newStatus).toMatchObject({
      name: "Verifying",
      category: "started",
      description: "QA is verifying the fix",
    });

    await expect(
      foreignApi.status.create({ team: created.slug, category: "started", name: "Verifying" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("status.create allows the same name in a different category (e.g. Ready in Unstarted and Started)", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Same Name Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });

    const unstartedReady = await foreignApi.status.create({
      team: created.slug,
      category: "unstarted",
      name: "Ready",
    });
    const startedReady = await foreignApi.status.create({
      team: created.slug,
      category: "started",
      name: "Ready",
    });

    expect(unstartedReady.category).toBe("unstarted");
    expect(startedReady.category).toBe("started");
    expect(unstartedReady.id).not.toBe(startedReady.id);
  });

  it("status.create rejects non-admin Members with FORBIDDEN", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Forbidden Create Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const nonAdmin = await createMemberInWorkspace(foreign.workspaceId, "member");
    const memberApi = createWorkspaceApi(foreign.workspaceId, nonAdmin.id);

    await expect(
      memberApi.status.create({ team: created.slug, category: "started", name: "Blocked" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("status.update edits name/description/color and returns NOT_FOUND for a foreign Team's Status", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Update Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const todoStatus = getStatus(await statusRowsForTeam(created.id), "Todo");

    const updated = await foreignApi.status.update({
      id: todoStatus.id,
      name: "To Do",
      description: "Not started yet",
    });
    expect(updated).toMatchObject({
      id: todoStatus.id,
      name: "To Do",
      description: "Not started yet",
    });

    await expect(api.status.update({ id: todoStatus.id, name: "Hijacked" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const [persisted] = await db.$client<{ name: string }[]>`
      SELECT name FROM "workflow_status" WHERE id = ${todoStatus.id}
    `;
    expect(persisted?.name).toBe("To Do");
  });

  it("status.update rejects non-admin Members with FORBIDDEN", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Forbidden Update Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const todoStatus = getStatus(await statusRowsForTeam(created.id), "Todo");
    const nonAdmin = await createMemberInWorkspace(foreign.workspaceId, "member");
    const memberApi = createWorkspaceApi(foreign.workspaceId, nonAdmin.id);

    await expect(
      memberApi.status.update({ id: todoStatus.id, name: "Blocked Rename" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("status.delete removes a Status when its category keeps at least one other", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Delete Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const inReviewStatus = getStatus(await statusRowsForTeam(created.id), "In Review");

    await expect(foreignApi.status.delete({ id: inReviewStatus.id })).resolves.toBeUndefined();

    const remaining = await statusRowsForTeam(created.id);
    expect(remaining.map(({ name }) => name)).not.toContain("In Review");
    expect(remaining).toHaveLength(6);
  });

  it("status.delete rejects removing the last Status in a category", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Last In Category Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const doneStatus = getStatus(await statusRowsForTeam(created.id), "Done");

    await expect(foreignApi.status.delete({ id: doneStatus.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    const [persisted] = await db.$client<{ id: string }[]>`
      SELECT id FROM "workflow_status" WHERE id = ${doneStatus.id}
    `;
    expect(persisted?.id).toBe(doneStatus.id);
  });

  it("status.delete rejects removing the system Duplicate Status", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Duplicate Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const duplicateStatus = getStatus(await statusRowsForTeam(created.id), "Duplicate");

    await expect(foreignApi.status.delete({ id: duplicateStatus.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("status.delete returns NOT_FOUND for a foreign Team's Status", async () => {
    const foreign = await createWorkspaceAndMember();
    const fixtureTeam = await createTeamWithoutStatuses(foreign.workspaceId);
    const seededStatus = { id: randomUUID(), teamId: fixtureTeam.id };
    await db.insert(workflowStatus).values({
      id: seededStatus.id,
      teamId: fixtureTeam.id,
      name: "Isolated Status",
      category: "started",
      color: "purple",
      position: 0,
    });

    await expect(api.status.delete({ id: seededStatus.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("status.setDefault marks a Backlog/Unstarted Status as the Team default and swaps the previous one", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Default Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const todoStatus = getStatus(await statusRowsForTeam(created.id), "Todo");

    await expect(foreignApi.status.setDefault({ id: todoStatus.id })).resolves.toBeUndefined();

    const [persistedTeam] = await db.$client<{ default_status_id: string | null }[]>`
      SELECT default_status_id FROM "team" WHERE id = ${created.id}
    `;
    expect(persistedTeam?.default_status_id).toBe(todoStatus.id);
  });

  it("status.setDefault rejects a Status outside Backlog/Unstarted", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Invalid Default Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const doneStatus = getStatus(await statusRowsForTeam(created.id), "Done");

    await expect(foreignApi.status.setDefault({ id: doneStatus.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("status.reorder changes a Status's position within its category", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const created = await foreignApi.team.create({
      name: `Reorder Team ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const startedRows = await statusRowsForTeam(created.id);
    expect(startedRows.filter((row) => row.category === "started").map(({ name }) => name)).toEqual(
      ["In Progress", "In Review"],
    );
    const inReview = getStatus(startedRows, "In Review");

    await expect(
      foreignApi.status.reorder({ id: inReview.id, position: 0 }),
    ).resolves.toBeUndefined();

    const startedAfter = await statusRowsForTeam(created.id).then((rows) =>
      rows.filter((row) => row.category === "started"),
    );
    expect(startedAfter.map(({ name }) => name)).toEqual(["In Review", "In Progress"]);
  });

  it("status.list reflects the real Vyzer/Zynox seed when the local fixture is populated", async () => {
    const vyzerStatuses = await statusRowsForTeam(VYZER_TEAM_ID);
    const zynoxStatuses = await statusRowsForTeam(ZYNOX_TEAM_ID);
    if (vyzerStatuses.length === 0 && zynoxStatuses.length === 0) {
      // Local fixture predates the Status seed migration; nothing to assert yet.
      return;
    }

    expect(vyzerStatuses).toHaveLength(7);
    expect(zynoxStatuses).toHaveLength(10);
    expect(vyzerStatuses.map(({ name }) => name)).toContain("Backlog");
    expect(zynoxStatuses.map(({ name }) => name)).toEqual(
      expect.arrayContaining([
        "Backlog",
        "Ready",
        "In Progress",
        "In Review",
        "Verifying",
        "Blocked",
        "Done",
        "Canceled",
        "Duplicate",
      ]),
    );

    const [vyzerTeam] = await db.$client<{ default_status_id: string | null }[]>`
      SELECT default_status_id FROM "team" WHERE id = ${VYZER_TEAM_ID}
    `;
    expect(vyzerTeam?.default_status_id).toBeTruthy();
  });
});
