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
  teamMember,
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Team settings tests.");
}

const db = createDb(testDatabaseUrl());
const api = createRouterClient(router, { context: { db, headers: new Headers() } });
const foreignWorkspaceIds: string[] = [];
const fixtureMemberIds: string[] = [];

function uniqueTeamKey(): string {
  return `T${randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

function issueEmailAddressFor(slug: string): string {
  const token = randomUUID().replaceAll("-", "").slice(0, 12);
  return `${slug}-${token}@intake.vyzer.app.br`;
}

function expectIssueEmailAddress(address: string, slug: string): void {
  expect(address.startsWith(`${slug}-`)).toBe(true);
  expect(address.slice(`${slug}-`.length)).toMatch(/^[a-f0-9]{12}@intake\.vyzer\.app\.br$/);
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
  const name = `Fixture Member ${suffix}`;
  const email = `${suffix}@example.test`;

  await db.insert(workspace).values({
    id: workspaceId,
    name: `Fixture Workspace ${suffix}`,
    slug: `fixture-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  foreignWorkspaceIds.push(workspaceId);
  await db.insert(member).values({ id: memberId, workspaceId, name, email, role });

  return { workspaceId, memberId, memberName: name, memberEmail: email, suffix };
}

async function createMemberInWorkspace(workspaceId: string, role: "admin" | "member" = "member") {
  const id = randomUUID();
  const suffix = randomUUID();
  const name = `Fixture Member ${suffix}`;
  const email = `${suffix}@example.test`;

  await db.insert(member).values({ id, workspaceId, name, email, role });
  return { id, name, email, role };
}

async function createTeam(
  workspaceId: string,
  options: { description?: string | null; name?: string } = {},
) {
  const id = randomUUID();
  const suffix = randomUUID();
  const name = options.name ?? `Fixture Team ${suffix}`;
  const slug = `fixture-team-${suffix}`;
  const key = uniqueTeamKey();

  await db.insert(team).values({
    id,
    workspaceId,
    name,
    slug,
    key,
    icon: { kind: "icon", name: "Layers", color: "purple" },
    description: options.description ?? null,
    issueEmailAddress: issueEmailAddressFor(slug),
  });

  return { id, name, slug, key };
}

async function createSeedWorkspaceMember(role: "admin" | "member") {
  const id = randomUUID();
  const suffix = randomUUID();
  const name = `Workspace Member ${suffix}`;
  const email = `${suffix}@example.test`;

  await db.insert(member).values({ id, workspaceId: WORKSPACE_ID, name, email, role });
  fixtureMemberIds.push(id);

  return { id, name, email, role };
}

afterEach(async () => {
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

describe("Workspace-scoped Team settings procedures", () => {
  it("team.get returns a Team in its Workspace and hides a foreign Team", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);

    const currentTeam = await foreignApi.team.get({ team: fixtureTeam.slug });

    expect(currentTeam).toMatchObject({
      id: fixtureTeam.id,
      name: fixtureTeam.name,
      slug: fixtureTeam.slug,
      key: fixtureTeam.key,
      description: null,
      icon: { kind: "icon", name: "Layers", color: "purple" },
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(currentTeam.createdAt))).toBe(false);
    expect(Number.isNaN(Date.parse(currentTeam.updatedAt))).toBe(false);

    await expect(api.team.get({ team: fixtureTeam.slug })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("team.update returns NOT_FOUND and leaves a foreign Team unchanged", async () => {
    const foreign = await createWorkspaceAndMember();
    const fixtureTeam = await createTeam(foreign.workspaceId);
    const attemptedName = `NoAccess ${randomUUID()}`;

    await expect(
      api.team.update({ id: fixtureTeam.id, name: attemptedName }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const [persisted] = await db.$client<{ name: string; slug: string; key: string }[]>`
      SELECT name, slug, key FROM "team" WHERE id = ${fixtureTeam.id}
    `;
    expect(persisted).toEqual({
      name: fixtureTeam.name,
      slug: fixtureTeam.slug,
      key: fixtureTeam.key,
    });
  });

  it("team.update rejects non-admin Members with FORBIDDEN", async () => {
    const testMember = await createSeedWorkspaceMember("member");
    const memberApi = createWorkspaceApi(WORKSPACE_ID, testMember.id);
    const [before] = await db.$client<{ name: string }[]>`
      SELECT name FROM "team" WHERE id = ${ZYNOX_TEAM_ID}
    `;

    await expect(
      memberApi.team.update({ id: ZYNOX_TEAM_ID, name: `Blocked ${randomUUID()}` }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const [after] = await db.$client<{ name: string }[]>`
      SELECT name FROM "team" WHERE id = ${ZYNOX_TEAM_ID}
    `;
    expect(after?.name).toBe(before?.name);
  });

  it("team.update returns CONFLICT when another Team in the Workspace owns the key", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const firstTeam = await createTeam(foreign.workspaceId);
    const secondTeam = await createTeam(foreign.workspaceId);

    await expect(
      foreignApi.team.update({ id: firstTeam.id, key: secondTeam.key }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const [persisted] = await db.$client<{ key: string }[]>`
      SELECT key FROM "team" WHERE id = ${firstTeam.id}
    `;
    expect(persisted?.key).toBe(firstTeam.key);
  });

  it("team.update preserves the Team slug when its name changes", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);
    const updatedName = `Team ${randomUUID()}`;
    const updatedKey = uniqueTeamKey();
    const updatedIcon = { kind: "emoji" as const, emoji: "🧭" };

    const updated = await foreignApi.team.update({
      id: fixtureTeam.id,
      name: updatedName,
      key: updatedKey,
      icon: updatedIcon,
    });

    expect(updated).toMatchObject({
      id: fixtureTeam.id,
      name: updatedName,
      slug: fixtureTeam.slug,
      key: updatedKey,
      icon: updatedIcon,
    });
    const [persisted] = await db.$client<
      {
        name: string;
        slug: string;
        key: string;
        icon: unknown;
      }[]
    >`
      SELECT name, slug, key, icon FROM "team" WHERE id = ${fixtureTeam.id}
    `;
    expect(persisted).toEqual({
      name: updatedName,
      slug: fixtureTeam.slug,
      key: updatedKey,
      icon: updatedIcon,
    });
  });

  it("team.update accepts an IANA timezone and team.get returns the saved timezone", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);

    const initial = await foreignApi.team.get({ team: fixtureTeam.slug });
    expect(initial.timezone).toBe("America/Sao_Paulo");

    const updated = await foreignApi.team.update({
      id: fixtureTeam.id,
      timezone: "Europe/Lisbon",
    });
    expect(updated.timezone).toBe("Europe/Lisbon");

    const fetched = await foreignApi.team.get({ team: fixtureTeam.slug });
    expect(fetched.timezone).toBe("Europe/Lisbon");
  });

  it("team.update rejects an invalid timezone without changing the saved timezone", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);

    await expect(
      foreignApi.team.update({ id: fixtureTeam.id, timezone: "Mars/Olympus_Mons" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const fetched = await foreignApi.team.get({ team: fixtureTeam.slug });
    expect(fetched.timezone).toBe("America/Sao_Paulo");
  });

  it("team.update toggles Team issue settings and accepts the estimation enum", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);

    const initial = await foreignApi.team.get({ team: fixtureTeam.slug });
    expect(initial).toMatchObject({
      detailedIssueHistory: false,
      issueEmailEnabled: false,
      estimation: "none",
    });

    const enabled = await foreignApi.team.update({
      id: fixtureTeam.id,
      detailedIssueHistory: true,
      issueEmailEnabled: true,
      estimation: "fibonacci",
    });
    expect(enabled).toMatchObject({
      detailedIssueHistory: true,
      issueEmailEnabled: true,
      estimation: "fibonacci",
    });

    const disabled = await foreignApi.team.update({
      id: fixtureTeam.id,
      detailedIssueHistory: false,
      issueEmailEnabled: false,
      estimation: "linear",
    });
    expect(disabled).toMatchObject({
      detailedIssueHistory: false,
      issueEmailEnabled: false,
      estimation: "linear",
    });
  });

  it("team.update rejects an estimation outside the supported enum", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);

    await expect(
      Reflect.apply(foreignApi.team.update, undefined, [
        { id: fixtureTeam.id, estimation: "invalid-estimation" },
      ]),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const unchanged = await foreignApi.team.get({ team: fixtureTeam.slug });
    expect(unchanged.estimation).toBe("none");
  });

  it("team.resetIssueEmail regenerates a slug address and enforces admin Workspace scope", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);
    const initial = await foreignApi.team.get({ team: fixtureTeam.slug });

    const reset = await foreignApi.team.resetIssueEmail({ id: fixtureTeam.id });
    expect(reset).toMatchObject({ id: fixtureTeam.id, slug: fixtureTeam.slug });
    expect(reset.issueEmailAddress).not.toBe(initial.issueEmailAddress);
    expectIssueEmailAddress(reset.issueEmailAddress, fixtureTeam.slug);

    await expect(api.team.resetIssueEmail({ id: fixtureTeam.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect((await foreignApi.team.get({ team: fixtureTeam.slug })).issueEmailAddress).toBe(
      reset.issueEmailAddress,
    );

    const nonAdmin = await createSeedWorkspaceMember("member");
    const nonAdminApi = createWorkspaceApi(WORKSPACE_ID, nonAdmin.id);
    const seedTeamBefore = await api.team.get({ team: "zynox" });
    await expect(nonAdminApi.team.resetIssueEmail({ id: ZYNOX_TEAM_ID })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect((await api.team.get({ team: "zynox" })).issueEmailAddress).toBe(
      seedTeamBefore.issueEmailAddress,
    );
  });

  it("team.create and team.update accept Team names up to 48 chars and keys up to 7 chars", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const maxName = "N".repeat(48);
    const maxKey = "T123456";
    const created = await foreignApi.team.create({
      name: maxName,
      key: maxKey,
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });

    expect(created.name).toBe(maxName);
    expect(created.key).toBe(maxKey);

    const updatedName = "U".repeat(48);
    const updatedKey = "U123456";
    const updated = await foreignApi.team.update({
      id: created.id,
      name: updatedName,
      key: updatedKey,
    });

    expect(updated.name).toBe(updatedName);
    expect(updated.key).toBe(updatedKey);
  });

  it("team.create and team.update reject Team names over 48 chars or keys over 7 chars", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);
    const tooLongName = "N".repeat(49);
    const validName = "Valid Team";
    const validKey = "T123456";
    const tooLongKey = "T1234567";
    const icon = { kind: "icon" as const, name: "Layers", color: "purple" as const };

    await expect(
      foreignApi.team.create({ name: tooLongName, key: validKey, icon }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      foreignApi.team.create({ name: validName, key: tooLongKey, icon }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      foreignApi.team.update({ id: fixtureTeam.id, name: tooLongName }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      foreignApi.team.update({ id: fixtureTeam.id, key: tooLongKey }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const unchanged = await foreignApi.team.get({ team: fixtureTeam.slug });
    expect(unchanged).toMatchObject({ name: fixtureTeam.name, key: fixtureTeam.key });
  });

  it("team.update can set and clear a Team description", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId, {
      description: "Original team description",
    });

    const described = await foreignApi.team.update({
      id: fixtureTeam.id,
      description: "Updated team description",
    });
    expect(described.description).toBe("Updated team description");

    const cleared = await foreignApi.team.update({ id: fixtureTeam.id, description: null });
    expect(cleared.description).toBeNull();
    const [persisted] = await db.$client<{ description: string | null }[]>`
      SELECT description FROM "team" WHERE id = ${fixtureTeam.id}
    `;
    expect(persisted?.description).toBeNull();
  });

  it("team.members lists only Members in its Workspace and returns NOT_FOUND for foreign or missing Teams", async () => {
    const foreign = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreign.workspaceId, foreign.memberId);
    const fixtureTeam = await createTeam(foreign.workspaceId);
    const extraMember = await createMemberInWorkspace(foreign.workspaceId);
    await db.insert(teamMember).values([
      { teamId: fixtureTeam.id, memberId: foreign.memberId },
      { teamId: fixtureTeam.id, memberId: extraMember.id },
    ]);

    const outsider = await createWorkspaceAndMember();
    const outsiderTeam = await createTeam(outsider.workspaceId);
    await db.insert(teamMember).values({
      teamId: fixtureTeam.id,
      memberId: outsider.memberId,
    });

    const listedMembers = await foreignApi.team.members({ id: fixtureTeam.id });
    const listedIds = listedMembers.map(({ id }) => id);
    expect(listedIds).toEqual(expect.arrayContaining([foreign.memberId, extraMember.id]));
    expect(listedMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: foreign.memberId,
          name: foreign.memberName,
          email: foreign.memberEmail,
          role: "admin",
          createdAt: expect.any(String),
        }),
        expect.objectContaining({
          id: extraMember.id,
          name: extraMember.name,
          email: extraMember.email,
          role: "member",
          createdAt: expect.any(String),
        }),
      ]),
    );
    expect(listedIds).not.toContain(outsider.memberId);

    const nonAdminApi = createWorkspaceApi(foreign.workspaceId, extraMember.id);
    await expect(nonAdminApi.team.members({ id: fixtureTeam.id })).resolves.toEqual(listedMembers);

    await expect(foreignApi.team.members({ id: outsiderTeam.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(foreignApi.team.members({ id: randomUUID() })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(api.team.members({ id: fixtureTeam.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
