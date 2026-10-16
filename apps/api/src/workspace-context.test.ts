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
  WORKSPACE_ID,
  workspace,
} from "@zynox/db";
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run API context tests.");
}

const db = createDb(testDatabaseUrl());
const api = createRouterClient(router, { context: { db, headers: new Headers() } });
const foreignWorkspaceIds: string[] = [];
const fixtureMemberIds: string[] = [];

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

  return { workspaceId, memberId };
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
  for (const memberId of fixtureMemberIds.splice(0)) {
    await db.$client`DELETE FROM "member" WHERE id = ${memberId}`;
  }
  for (const workspaceId of foreignWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "member" WHERE workspace_id = ${workspaceId}`;
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace/Member context middleware", () => {
  it("workspace.current returns only the fixed seed context when another Workspace and Member exist", async () => {
    const foreign = await createForeignWorkspaceAndMember();
    const [seedWorkspace] = await db.$client<{ logo_url: string | null }[]>`
      SELECT logo_url FROM "workspace" WHERE id = ${WORKSPACE_ID}
    `;

    const current = await api.workspace.current();

    expect(current).toEqual({
      workspace: {
        id: WORKSPACE_ID,
        name: "Zynox",
        slug: "zynox-dev",
        fiscalYearStartMonth: 1,
        region: "United States",
        logoUrl: seedWorkspace?.logo_url ?? null,
        icon: { kind: "icon", name: "Zap", color: "red" },
        apiKeyPolicy: "all_members",
      },
      member: {
        id: MEMBER_ID,
        name: expect.any(String),
        email: "andrejunio.dev@gmail.com",
        role: "admin",
        title: null,
        username: null,
        avatarUrl: null,
      },
    });
    expect(current.member.name).not.toBe("");
    expect(current.workspace.id).not.toBe(foreign.workspaceId);
    expect(current.member.id).not.toBe(foreign.memberId);
  });

  it("workspace.update only updates the Workspace resolved by middleware", async () => {
    const foreign = await createForeignWorkspaceAndMember("admin");
    const foreignApi = createRouterClient(
      createRouter((contextDb) =>
        resolveWorkspaceMember(contextDb, foreign.workspaceId, foreign.memberId),
      ),
      { context: { db, headers: new Headers() } },
    );
    const updatedName = `Updated Workspace ${randomUUID()}`;
    const logoUrl = `/api/workspace/logo/${randomUUID()}.png`;

    const updated = await foreignApi.workspace.update({ name: updatedName, logoUrl });
    const [seedWorkspace] = await db.$client<{ name: string; logo_url: string | null }[]>`
      SELECT name, logo_url FROM "workspace" WHERE id = ${WORKSPACE_ID}
    `;
    const [foreignWorkspace] = await db.$client<{ name: string; logo_url: string | null }[]>`
      SELECT name, logo_url FROM "workspace" WHERE id = ${foreign.workspaceId}
    `;

    expect(updated).toMatchObject({ id: foreign.workspaceId, name: updatedName, logoUrl });
    expect(seedWorkspace).toEqual({ name: "Zynox", logo_url: null });
    expect(foreignWorkspace).toEqual({ name: updatedName, logo_url: logoUrl });
  });

  it("workspace.update persists slug and fiscalYearStartMonth", async () => {
    const foreign = await createForeignWorkspaceAndMember("admin");
    const foreignApi = createRouterClient(
      createRouter((contextDb) =>
        resolveWorkspaceMember(contextDb, foreign.workspaceId, foreign.memberId),
      ),
      { context: { db, headers: new Headers() } },
    );
    const slug = `workspace-${randomUUID()}`;
    const fiscalYearStartMonth = 4;

    const updated = await foreignApi.workspace.update({ slug, fiscalYearStartMonth });
    const [persisted] = await db.$client<
      { slug: string; fiscal_year_start_month: number }[]
    >`SELECT slug, fiscal_year_start_month FROM "workspace" WHERE id = ${foreign.workspaceId}`;

    expect(updated).toMatchObject({
      id: foreign.workspaceId,
      slug,
      fiscalYearStartMonth,
    });
    expect(persisted).toEqual({ slug, fiscal_year_start_month: fiscalYearStartMonth });
  });

  it("workspace.update can clear the logoUrl", async () => {
    const foreign = await createForeignWorkspaceAndMember("admin");
    const foreignApi = createRouterClient(
      createRouter((contextDb) =>
        resolveWorkspaceMember(contextDb, foreign.workspaceId, foreign.memberId),
      ),
      { context: { db, headers: new Headers() } },
    );
    const logoUrl = `/api/workspace/logo/${randomUUID()}.png`;

    await foreignApi.workspace.update({ logoUrl });
    const cleared = await foreignApi.workspace.update({ logoUrl: null });

    expect(cleared.logoUrl).toBeNull();
  });

  it("workspace.update rejects a non-admin member with FORBIDDEN", async () => {
    const testMember = await createSeedWorkspaceMember("member");
    const memberRouter = createRouter((contextDb) =>
      resolveWorkspaceMember(contextDb, WORKSPACE_ID, testMember.id),
    );
    const memberApi = createRouterClient(memberRouter, {
      context: { db, headers: new Headers() },
    });

    await expect(memberApi.workspace.update({ name: "Not allowed" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("workspace.delete rejects a non-admin member with FORBIDDEN", async () => {
    const testMember = await createSeedWorkspaceMember("member");
    const memberApi = createRouterClient(
      createRouter((contextDb) => resolveWorkspaceMember(contextDb, WORKSPACE_ID, testMember.id)),
      { context: { db, headers: new Headers() } },
    );

    await expect(memberApi.workspace.delete()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("workspace.delete removes an admin's Workspace and cascades its Members", async () => {
    const fixture = await createForeignWorkspaceAndMember("admin");
    const fixtureApi = createRouterClient(
      createRouter((contextDb) =>
        resolveWorkspaceMember(contextDb, fixture.workspaceId, fixture.memberId),
      ),
      { context: { db, headers: new Headers() } },
    );

    await expect(fixtureApi.workspace.delete()).resolves.toBeUndefined();

    const [remainingWorkspace] = await db.$client<{ id: string }[]>`
      SELECT id FROM "workspace" WHERE id = ${fixture.workspaceId}
    `;
    const [remainingMember] = await db.$client<{ id: string }[]>`
      SELECT id FROM "member" WHERE id = ${fixture.memberId}
    `;
    expect(remainingWorkspace).toBeUndefined();
    expect(remainingMember).toBeUndefined();
  });

  it("member.list excludes Members from another Workspace", async () => {
    const foreign = await createForeignWorkspaceAndMember();

    const members = await api.member.list();

    expect(members.map(({ id }) => id)).not.toContain(foreign.memberId);
  });

  it("member.update returns NOT_FOUND and leaves a foreign Workspace Member unchanged", async () => {
    const foreign = await createForeignWorkspaceAndMember();
    const [before] = await db.$client<{ name: string }[]>`
      SELECT name FROM "member" WHERE id = ${foreign.memberId}
    `;
    const attemptedName = `Unauthorized Rename ${randomUUID()}`;

    await expect(
      api.member.update({ id: foreign.memberId, name: attemptedName }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    const [after] = await db.$client<{ name: string }[]>`
      SELECT name FROM "member" WHERE id = ${foreign.memberId}
    `;
    expect(after?.name).toBe(before?.name);
    expect(after?.name).not.toBe(attemptedName);
  });

  it("member.update rejects a non-admin member with FORBIDDEN", async () => {
    const testMember = await createSeedWorkspaceMember("member");
    const memberRouter = createRouter((contextDb) =>
      resolveWorkspaceMember(contextDb, WORKSPACE_ID, testMember.id),
    );
    const memberApi = createRouterClient(memberRouter, {
      context: { db, headers: new Headers() },
    });

    await expect(
      memberApi.member.update({ id: testMember.id, name: "Not allowed" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("member.update renames a Member in the resolved Workspace for an admin", async () => {
    const testMember = await createSeedWorkspaceMember("admin");
    const memberRouter = createRouter((contextDb) =>
      resolveWorkspaceMember(contextDb, WORKSPACE_ID, testMember.id),
    );
    const memberApi = createRouterClient(memberRouter, {
      context: { db, headers: new Headers() },
    });
    const updatedName = `Renamed Member ${randomUUID()}`;

    const updated = await memberApi.member.update({ id: testMember.id, name: updatedName });
    const [persisted] = await db.$client<{ name: string }[]>`
      SELECT name FROM "member" WHERE id = ${testMember.id}
    `;

    expect(updated).toMatchObject({
      id: testMember.id,
      name: updatedName,
      email: testMember.email,
      role: "admin",
      createdAt: expect.any(String),
    });
    expect(Number.isNaN(Date.parse(updated.createdAt))).toBe(false);
    expect(persisted?.name).toBe(updatedName);
  });
});
