import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, resolveWorkspaceMember, workspace } from "@zynox/db";
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Sidebar preference tests.");
}

const db = createDb(testDatabaseUrl());
const workspaceIds: string[] = [];

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
    name: `Sidebar fixture ${suffix}`,
    slug: `sidebar-fixture-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  workspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Sidebar member ${suffix}`,
    email: `${suffix}@example.test`,
    role: "admin",
  });

  return { workspaceId, memberId, api: createWorkspaceApi(workspaceId, memberId) };
}

async function createMemberApi(workspaceId: string) {
  const memberId = randomUUID();
  const suffix = randomUUID();
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Sidebar member ${suffix}`,
    email: `${suffix}@example.test`,
    role: "member",
  });
  return createWorkspaceApi(workspaceId, memberId);
}

afterEach(async () => {
  for (const workspaceId of workspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace-scoped sidebar preferences", () => {
  it("returns Linear defaults and persists badge, visibility, and per-group order for the current Member", async () => {
    const first = await createWorkspaceAndMember();
    const second = await createWorkspaceAndMember();
    const anotherMember = await createMemberApi(first.workspaceId);

    const defaults = await first.api.sidebarPreferences.get();
    expect(defaults).toEqual({
      workspaceId: first.workspaceId,
      memberId: first.memberId,
      badgeStyle: "count",
      items: [
        { key: "inbox", visibility: "always", sortOrder: 0 },
        { key: "reviews", visibility: "always", sortOrder: 1 },
        { key: "my-issues", visibility: "always", sortOrder: 2 },
        { key: "agent", visibility: "always", sortOrder: 3 },
        { key: "drafts", visibility: "when-badged", sortOrder: 4 },
        { key: "projects", visibility: "always", sortOrder: 0 },
        { key: "views", visibility: "always", sortOrder: 1 },
        { key: "members", visibility: "hidden", sortOrder: 2 },
        { key: "teams", visibility: "hidden", sortOrder: 3 },
      ],
    });

    const saved = await first.api.sidebarPreferences.update({
      badgeStyle: "dot",
      items: [
        { key: "drafts", visibility: "always" },
        { key: "members", visibility: "always" },
        { key: "projects", sortOrder: 1 },
        { key: "views", sortOrder: 0 },
      ],
    });

    expect(saved.badgeStyle).toBe("dot");
    expect(saved.items).toEqual([
      { key: "inbox", visibility: "always", sortOrder: 0 },
      { key: "reviews", visibility: "always", sortOrder: 1 },
      { key: "my-issues", visibility: "always", sortOrder: 2 },
      { key: "agent", visibility: "always", sortOrder: 3 },
      { key: "drafts", visibility: "always", sortOrder: 4 },
      { key: "views", visibility: "always", sortOrder: 0 },
      { key: "projects", visibility: "always", sortOrder: 1 },
      { key: "members", visibility: "always", sortOrder: 2 },
      { key: "teams", visibility: "hidden", sortOrder: 3 },
    ]);
    await expect(first.api.sidebarPreferences.get()).resolves.toEqual(saved);
    await expect(anotherMember.sidebarPreferences.get()).resolves.toMatchObject({
      badgeStyle: "count",
      items: expect.arrayContaining([
        expect.objectContaining({ key: "members", visibility: "hidden" }),
      ]),
    });
    await expect(second.api.sidebarPreferences.get()).resolves.toMatchObject({
      workspaceId: second.workspaceId,
      badgeStyle: "count",
    });
  });

  it("rejects invalid item keys and duplicate preference patches", async () => {
    const owner = await createWorkspaceAndMember();

    await expect(
      owner.api.sidebarPreferences.update({
        items: [{ key: "unknown" as never, visibility: "always" }],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      owner.api.sidebarPreferences.update({
        items: [
          { key: "inbox", visibility: "always" },
          { key: "inbox", visibility: "hidden" },
        ],
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});
