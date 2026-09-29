import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import {
  createDb,
  member,
  MEMBER_ID,
  resolveWorkspaceMember,
  team,
  teamMember,
  VYZER_TEAM_ID,
  WORKSPACE_ID,
  workspace,
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run API Team tests.");
}

const db = createDb(testDatabaseUrl());
const api = createRouterClient(router, { context: { db, headers: new Headers() } });
const foreignWorkspaceIds: string[] = [];
const fixtureMemberIds: string[] = [];
const fixtureTeamIds: string[] = [];

function uniqueTeamKey(): string {
  return `T${randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function createWorkspaceApi(workspaceId: string, memberId: string) {
  const scopedRouter = createRouter((contextDb) =>
    resolveWorkspaceMember(contextDb, workspaceId, memberId),
  );
  return createRouterClient(scopedRouter, { context: { db, headers: new Headers() } });
}

async function createForeignWorkspaceAndMember(role: "admin" | "member" = "member") {
  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const suffix = randomUUID();

  await db.insert(workspace).values({
    id: workspaceId,
    name: `Unrelated Workspace ${suffix}`,
    slug: `unrelated-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  foreignWorkspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Unrelated Member ${suffix}`,
    email: `${suffix}@example.test`,
    role,
  });

  return { workspaceId, memberId, suffix };
}

async function createSeedWorkspaceMember(role: "admin" | "member") {
  const memberId = randomUUID();
  const suffix = randomUUID();
  const name = `Workspace Member ${suffix}`;
  const email = `${suffix}@example.test`;

  await db.insert(member).values({
    id: memberId,
    workspaceId: WORKSPACE_ID,
    name,
    email,
    role,
  });
  fixtureMemberIds.push(memberId);

  return { id: memberId, name, email };
}

afterEach(async () => {
  for (const teamId of fixtureTeamIds.splice(0)) {
    await db.$client`DELETE FROM "team" WHERE id = ${teamId}`;
  }
  for (const memberId of fixtureMemberIds.splice(0)) {
    await db.$client`DELETE FROM "member" WHERE id = ${memberId}`;
  }
  for (const workspaceId of foreignWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace-scoped Team procedures", () => {
  it("team.list includes only current Workspace Teams and their member/issue counts", async () => {
    const foreign = await createForeignWorkspaceAndMember();
    const foreignTeamId = randomUUID();
    await db.insert(team).values({
      id: foreignTeamId,
      workspaceId: foreign.workspaceId,
      name: `Foreign Team ${foreign.suffix}`,
      slug: `foreign-team-${foreign.suffix}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });

    const teams = await api.team.list();
    const teamIds = teams.map(({ id }) => id);

    expect(teamIds).toEqual(expect.arrayContaining([ZYNOX_TEAM_ID, VYZER_TEAM_ID]));
    expect(teamIds).not.toContain(foreignTeamId);
    expect(teams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: ZYNOX_TEAM_ID, memberCount: 1, issueCount: 0 }),
        expect.objectContaining({ id: VYZER_TEAM_ID, memberCount: 1, issueCount: 0 }),
      ]),
    );
    for (const currentTeam of teams) {
      expect(Number.isNaN(Date.parse(currentTeam.createdAt))).toBe(false);
      expect(Number.isNaN(Date.parse(currentTeam.updatedAt))).toBe(false);
    }
  });

  it("team.create derives a slug and persists the Team in the resolved Workspace", async () => {
    const suffix = randomUUID();
    const name = `Integration Team ${suffix}`;
    const key = uniqueTeamKey();
    const icon = { kind: "icon" as const, name: "Navigation", color: "cyan" as const };

    const created = await api.team.create({ name, key, icon });
    fixtureTeamIds.push(created.id);
    const [persisted] = await db.$client<{ workspace_id: string }[]>`
      SELECT workspace_id FROM "team" WHERE id = ${created.id}
    `;

    expect(created).toMatchObject({
      id: expect.any(String),
      name,
      slug: `integration-team-${suffix}`,
      key,
      icon,
      description: null,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(created.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(created.updatedAt))).toBe(false);
    expect(persisted?.workspace_id).toBe(WORKSPACE_ID);
  });

  it("team.create returns CONFLICT for duplicate slug and key in the same Workspace", async () => {
    const foreign = await createForeignWorkspaceAndMember("admin");
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const suffix = randomUUID();
    const name = `Conflict Team ${suffix}`;
    const key = uniqueTeamKey();

    await foreignApi.team.create({
      name,
      key,
      icon: { kind: "emoji", emoji: "🧭" },
    });

    await expect(
      foreignApi.team.create({
        name,
        key: uniqueTeamKey(),
        icon: { kind: "emoji", emoji: "🧭" },
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await expect(
      foreignApi.team.create({
        name: `Another Conflict Team ${suffix}`,
        key,
        icon: { kind: "emoji", emoji: "🧭" },
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("team.delete only deletes a Team in the resolved Workspace", async () => {
    const foreign = await createForeignWorkspaceAndMember("admin");
    const foreignTeamId = randomUUID();
    await db.insert(team).values({
      id: foreignTeamId,
      workspaceId: foreign.workspaceId,
      name: `Foreign Team ${foreign.suffix}`,
      slug: `foreign-team-${foreign.suffix}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });

    await expect(api.team.delete({ id: foreignTeamId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const [stillForeign] = await db.$client<{ id: string }[]>`
      SELECT id FROM "team" WHERE id = ${foreignTeamId}
    `;
    expect(stillForeign?.id).toBe(foreignTeamId);

    const created = await api.team.create({
      name: `Delete Me ${randomUUID()}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Trash2", color: "red" },
    });
    fixtureTeamIds.push(created.id);

    await expect(api.team.delete({ id: created.id })).resolves.toBeUndefined();
    const [deleted] = await db.$client<{ id: string }[]>`
      SELECT id FROM "team" WHERE id = ${created.id}
    `;
    expect(deleted).toBeUndefined();
  });

  it("non-admin Members receive FORBIDDEN for Team create and delete", async () => {
    const testMember = await createSeedWorkspaceMember("member");
    const memberApi = createWorkspaceApi(WORKSPACE_ID, testMember.id);

    await expect(
      memberApi.team.create({
        name: `Not Allowed ${randomUUID()}`,
        key: uniqueTeamKey(),
        icon: { kind: "icon", name: "Ban", color: "red" },
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    await expect(memberApi.team.delete({ id: ZYNOX_TEAM_ID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const [stillPresent] = await db.$client<{ id: string }[]>`
      SELECT id FROM "team" WHERE id = ${ZYNOX_TEAM_ID}
    `;
    expect(stillPresent?.id).toBe(ZYNOX_TEAM_ID);
  });

  it("member.list includes teamCount for its Workspace and excludes foreign Members", async () => {
    const testMember = await createSeedWorkspaceMember("member");
    await db.insert(teamMember).values([
      { teamId: ZYNOX_TEAM_ID, memberId: testMember.id },
      { teamId: VYZER_TEAM_ID, memberId: testMember.id },
    ]);

    const foreign = await createForeignWorkspaceAndMember();
    const foreignTeamId = randomUUID();
    await db.insert(team).values({
      id: foreignTeamId,
      workspaceId: foreign.workspaceId,
      name: `Foreign Team ${foreign.suffix}`,
      slug: `foreign-team-${foreign.suffix}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    await db.insert(teamMember).values({ teamId: foreignTeamId, memberId: foreign.memberId });

    const members = await api.member.list();
    const listedMember = members.find(({ id }) => id === testMember.id);

    expect(listedMember).toMatchObject({ id: testMember.id, teamCount: 2 });
    expect(members.map(({ id }) => id)).toContain(MEMBER_ID);
    expect(members.map(({ id }) => id)).not.toContain(foreign.memberId);
  });
});
