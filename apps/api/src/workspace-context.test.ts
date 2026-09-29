import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, MEMBER_ID, WORKSPACE_ID, workspace } from "@vyzer/db";
import { router } from "./router";

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

async function createForeignWorkspaceAndMember() {
  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const suffix = randomUUID();

  await db.insert(workspace).values({ id: workspaceId, name: `Unrelated Workspace ${suffix}` });
  foreignWorkspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Unrelated Member ${suffix}`,
    email: `${suffix}@example.test`,
    role: "member",
  });

  return { workspaceId, memberId };
}

afterEach(async () => {
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

    const current = await api.workspace.current();

    expect(current).toEqual({
      workspace: { id: WORKSPACE_ID, name: "Zynox" },
      member: {
        id: MEMBER_ID,
        name: expect.any(String),
        email: "andrejunio.dev@gmail.com",
        role: "admin",
      },
    });
    expect(current.member.name).not.toBe("");
    expect(current.workspace.id).not.toBe(foreign.workspaceId);
    expect(current.member.id).not.toBe(foreign.memberId);
  });
});
