import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import {
  createDb,
  member,
  resolveWorkspaceMember,
  workspace,
  type ApiKeyPermissions,
} from "@vyzer/db";
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Issue draft tests.");
}

const db = createDb(testDatabaseUrl());
const workspaceIds: string[] = [];

function createWorkspaceApi(
  workspaceId: string,
  memberId: string,
  permissions?: ApiKeyPermissions,
) {
  const scopedRouter = createRouter(async (contextDb) => {
    const resolved = await resolveWorkspaceMember(contextDb, workspaceId, memberId);
    if (!resolved || permissions === undefined) return resolved;
    return { ...resolved, apiKey: { id: randomUUID(), permissions } };
  });
  return createRouterClient(scopedRouter, { context: { db, headers: new Headers() } });
}

async function createWorkspaceAndMember() {
  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const suffix = randomUUID();

  await db.insert(workspace).values({
    id: workspaceId,
    name: `Draft fixture ${suffix}`,
    slug: `draft-fixture-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  workspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Draft member ${suffix}`,
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
    name: `Draft member ${suffix}`,
    email: `${suffix}@example.test`,
    role: "member",
  });
  return createWorkspaceApi(workspaceId, memberId);
}

function uniqueTeamKey() {
  return `D${randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`;
}

afterEach(async () => {
  for (const workspaceId of workspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace-scoped Issue draft procedures", () => {
  it("creates blank drafts, lists and updates only drafts owned by the current Member, then discards them", async () => {
    const owner = await createWorkspaceAndMember();
    const otherWorkspace = await createWorkspaceAndMember();
    const anotherMember = await createMemberApi(owner.workspaceId);
    const blankDraft = await owner.api.issueDraft.create({});

    expect(blankDraft).toMatchObject({
      workspaceId: owner.workspaceId,
      creatorId: owner.memberId,
      teamId: null,
      title: "",
      description: null,
    });
    await expect(owner.api.issueDraft.list()).resolves.toEqual([blankDraft]);
    await expect(anotherMember.issueDraft.list()).resolves.toEqual([]);
    await expect(otherWorkspace.api.issueDraft.list()).resolves.toEqual([]);

    const updated = await owner.api.issueDraft.update({
      id: blankDraft.id,
      title: "Persisted without publishing",
      description: "Draft content",
    });
    expect(updated).toMatchObject({
      id: blankDraft.id,
      title: "Persisted without publishing",
      description: "Draft content",
    });

    await expect(
      anotherMember.issueDraft.update({ id: blankDraft.id, title: "Someone else's draft" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      otherWorkspace.api.issueDraft.discard({ id: blankDraft.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    await owner.api.issueDraft.discard({ id: blankDraft.id });
    await expect(owner.api.issueDraft.list()).resolves.toEqual([]);
  });

  it("publishes a complete draft as an Issue with the Team's default Status and removes the draft", async () => {
    const owner = await createWorkspaceAndMember();
    const currentTeam = await owner.api.team.create({
      name: `Draft publish ${randomUUID().slice(0, 8)}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const draft = await owner.api.issueDraft.create({
      teamId: currentTeam.id,
      title: "First published draft",
      description: "Description from the draft",
    });

    const published = await owner.api.issueDraft.publish({ id: draft.id });
    expect(published).toMatchObject({
      identifier: `${currentTeam.key}-1`,
      teamId: currentTeam.id,
      title: "First published draft",
      description: "Description from the draft",
      status: { name: "Backlog" },
    });
    await expect(owner.api.issueDraft.list()).resolves.toEqual([]);
    await expect(owner.api.issue.events({ id: published.id })).resolves.toEqual([
      expect.objectContaining({ type: "created", issueId: published.id }),
    ]);
  });

  it("requires a title and a Team to publish, preserving the draft after validation errors", async () => {
    const owner = await createWorkspaceAndMember();
    const draft = await owner.api.issueDraft.create({});

    await expect(owner.api.issueDraft.publish({ id: draft.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await owner.api.issueDraft.update({ id: draft.id, title: "Ready when assigned" });
    await expect(owner.api.issueDraft.publish({ id: draft.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });

    const currentTeam = await owner.api.team.create({
      name: `Draft validation ${randomUUID().slice(0, 8)}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const untitled = await owner.api.issueDraft.update({
      id: draft.id,
      teamId: currentTeam.id,
      title: "",
    });
    await expect(owner.api.issueDraft.publish({ id: untitled.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(owner.api.issueDraft.list()).resolves.toEqual([
      expect.objectContaining({ id: draft.id }),
    ]);
  });

  it("rejects Teams from another Workspace and enforces API key permissions", async () => {
    const owner = await createWorkspaceAndMember();
    const otherWorkspace = await createWorkspaceAndMember();
    const foreignTeam = await otherWorkspace.api.team.create({
      name: `Foreign draft ${randomUUID().slice(0, 8)}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });

    await expect(
      owner.api.issueDraft.create({ teamId: foreignTeam.id, title: "Cross-workspace" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const draft = await owner.api.issueDraft.create({ title: "Issue for an API key" });
    await expect(
      owner.api.issueDraft.update({ id: draft.id, teamId: foreignTeam.id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const readOnlyApi = createWorkspaceApi(owner.workspaceId, owner.memberId, ["read"]);
    await expect(readOnlyApi.issueDraft.create({})).rejects.toMatchObject({ code: "FORBIDDEN" });

    const currentTeam = await owner.api.team.create({
      name: `Authorized publish ${randomUUID().slice(0, 8)}`,
      key: uniqueTeamKey(),
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const publishable = await owner.api.issueDraft.update({
      id: draft.id,
      teamId: currentTeam.id,
      title: "Authorized publication",
    });
    const issueCreateApi = createWorkspaceApi(owner.workspaceId, owner.memberId, ["issues:create"]);
    await expect(issueCreateApi.issueDraft.publish({ id: publishable.id })).resolves.toMatchObject({
      title: "Authorized publication",
    });
  });
});
