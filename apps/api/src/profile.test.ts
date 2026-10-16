import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, resolveWorkspaceMember, workspace, type Db } from "@zynox/db";
import { createApp } from "./app";
import { createRouter } from "./router";
import { type WorkspaceLogoObject, type WorkspaceLogoStorage } from "./workspace-logo";

function testDatabaseUrl(): string {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  try {
    const rootEnv = parseEnv(readFileSync(new URL("../../../.env", import.meta.url), "utf8"));
    if (rootEnv.TEST_DATABASE_URL) return rootEnv.TEST_DATABASE_URL;
  } catch {
    // CI and local runners can provide TEST_DATABASE_URL directly.
  }

  throw new Error("Set TEST_DATABASE_URL to an isolated database to run Profile tests.");
}

const db = createDb(testDatabaseUrl());
const fixtureWorkspaceIds: string[] = [];

type FixtureRole = "admin" | "member";

async function createWorkspaceFixture(roles: FixtureRole[]) {
  const workspaceId = randomUUID();
  const suffix = randomUUID().replaceAll("-", "");
  await db.insert(workspace).values({
    id: workspaceId,
    name: `Profile Workspace ${suffix}`,
    slug: `profile-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  fixtureWorkspaceIds.push(workspaceId);

  const members = roles.map((role) => {
    const id = randomUUID();
    return {
      id,
      workspaceId,
      name: `Profile Member ${id}`,
      email: `${id}@example.test`,
      role,
    };
  });
  await db.insert(member).values(members);

  return { workspaceId, members };
}

function workspaceApi(database: Db, workspaceId: string, memberId: string) {
  return createRouterClient(
    createRouter((contextDb) => resolveWorkspaceMember(contextDb, workspaceId, memberId)),
    { context: { db: database, headers: new Headers() } },
  );
}

function createMemoryImageStorage() {
  const objects = new Map<string, WorkspaceLogoObject>();
  const writes: Array<{ key: string; contentType: string }> = [];
  const logoStorage: WorkspaceLogoStorage = {
    async put(input) {
      writes.push({ key: input.key, contentType: input.contentType });
      objects.set(input.key, { body: input.body, contentType: input.contentType });
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
  };
  return { logoStorage, writes };
}

function createAvatarFile(): File {
  const image = new Uint8Array(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=",
      "base64",
    ),
  );
  const buffer = new ArrayBuffer(image.byteLength);
  new Uint8Array(buffer).set(image);
  return new File([buffer], "profile.png", { type: "image/png" });
}

afterEach(async () => {
  for (const workspaceId of fixtureWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Member Profile procedures", () => {
  it("lets a non-admin read and update only their own Profile", async () => {
    const fixture = await createWorkspaceFixture(["admin", "member"]);
    const self = fixture.members[1];
    const admin = fixture.members[0];
    if (!self || !admin) throw new Error("Profile fixture Members were not created.");
    const api = workspaceApi(db, fixture.workspaceId, self.id);
    const original = await api.profile.get();

    expect(original).toMatchObject({
      id: self.id,
      name: self.name,
      email: self.email,
      role: "member",
      title: null,
      username: null,
      avatarUrl: null,
      canLeaveWorkspace: true,
    });

    const updated = await api.profile.update({
      name: "Avery Nguyen",
      title: "Staff Engineer",
      username: "Avery.Nguyen",
    });

    expect(updated).toMatchObject({
      id: self.id,
      name: "Avery Nguyen",
      email: self.email,
      role: "member",
      title: "Staff Engineer",
      username: "avery.nguyen",
      canLeaveWorkspace: true,
    });
    await expect(api.profile.get()).resolves.toMatchObject({
      name: "Avery Nguyen",
      title: "Staff Engineer",
      username: "avery.nguyen",
    });
    await expect(
      api.member.update({ id: admin.id, name: "Changed by member" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("rejects a username already used in the same Workspace", async () => {
    const fixture = await createWorkspaceFixture(["admin", "member"]);
    const first = fixture.members[0];
    const second = fixture.members[1];
    if (!first || !second) throw new Error("Profile fixture Members were not created.");
    const firstApi = workspaceApi(db, fixture.workspaceId, first.id);
    const secondApi = workspaceApi(db, fixture.workspaceId, second.id);

    await firstApi.profile.update({ username: "northstar" });
    await expect(secondApi.profile.update({ username: "NorthStar" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(secondApi.profile.get()).resolves.toMatchObject({ username: null });
  });

  it("allows a Member to leave while preserving their Issues and history", async () => {
    const fixture = await createWorkspaceFixture(["admin", "member"]);
    const admin = fixture.members[0];
    const self = fixture.members[1];
    if (!admin || !self) throw new Error("Profile fixture Members were not created.");
    const adminApi = workspaceApi(db, fixture.workspaceId, admin.id);
    const selfApi = workspaceApi(db, fixture.workspaceId, self.id);
    const suffix = randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase();
    const team = await adminApi.team.create({
      name: `Profile History ${suffix}`,
      key: `P${suffix}`,
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const issue = await selfApi.issue.create({
      team: team.slug,
      title: "Issue created by departing Member",
    });
    await selfApi.link.add({ issueId: issue.id, url: "https://example.test/history" });
    await adminApi.issue.update({ id: issue.id, assigneeId: self.id });

    await expect(selfApi.profile.get()).resolves.toMatchObject({ canLeaveWorkspace: true });
    await expect(selfApi.profile.leaveWorkspace()).resolves.toBeUndefined();

    const persistedIssue = await adminApi.issue.get({ identifier: issue.identifier });
    expect(persistedIssue).toMatchObject({
      id: issue.id,
      creatorId: null,
      creator: null,
      assigneeId: null,
      assignee: null,
      links: [{ creatorId: null }],
    });
    const events = await adminApi.issue.events({ id: issue.id });
    expect(events.find(({ type }) => type === "created")).toMatchObject({
      actorId: null,
      actor: null,
    });
    await expect(adminApi.member.list()).resolves.not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: self.id })]),
    );
  });

  it("blocks the last Member from leaving the Workspace", async () => {
    const fixture = await createWorkspaceFixture(["admin"]);
    const self = fixture.members[0];
    if (!self) throw new Error("Profile fixture Member was not created.");
    const api = workspaceApi(db, fixture.workspaceId, self.id);

    await expect(api.profile.get()).resolves.toMatchObject({ canLeaveWorkspace: false });
    await expect(api.profile.leaveWorkspace()).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(api.profile.get()).resolves.toMatchObject({ id: self.id });
  });

  it("blocks the last admin from leaving the Workspace", async () => {
    const fixture = await createWorkspaceFixture(["admin", "member"]);
    const admin = fixture.members[0];
    if (!admin) throw new Error("Profile fixture admin was not created.");
    const api = workspaceApi(db, fixture.workspaceId, admin.id);

    await expect(api.profile.get()).resolves.toMatchObject({ canLeaveWorkspace: false });
    await expect(api.profile.leaveWorkspace()).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(api.profile.get()).resolves.toMatchObject({ id: admin.id });
  });
});

describe("Member avatar API", () => {
  it("stores an uploaded avatar for the current Member and serves it to the Workspace", async () => {
    const fixture = await createWorkspaceFixture(["admin"]);
    const self = fixture.members[0];
    if (!self) throw new Error("Profile fixture Member was not created.");
    const { logoStorage, writes } = createMemoryImageStorage();
    const app = createApp({
      db,
      logoStorage,
      resolveWorkspaceContext: (contextDb) =>
        resolveWorkspaceMember(contextDb, fixture.workspaceId, self.id),
    });
    const formData = new FormData();
    formData.set("file", createAvatarFile());

    const uploadResponse = await app.request("/api/member/avatar", {
      method: "POST",
      body: formData,
    });

    expect(uploadResponse.status).toBe(201);
    const { avatarUrl } = (await uploadResponse.json()) as { avatarUrl: string };
    expect(avatarUrl).toMatch(/^\/api\/member\/avatar\/[0-9a-f-]+\.png$/);
    expect(writes).toEqual([
      {
        key: `${fixture.workspaceId}/members/${self.id}/avatars/${avatarUrl.split("/").at(-1)}`,
        contentType: "image/png",
      },
    ]);
    await expect(
      workspaceApi(db, fixture.workspaceId, self.id).profile.get(),
    ).resolves.toMatchObject({ avatarUrl });

    const imageResponse = await app.request(avatarUrl);
    expect(imageResponse.status).toBe(200);
    expect(imageResponse.headers.get("content-type")).toBe("image/png");
    expect(imageResponse.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await imageResponse.arrayBuffer())).toEqual(
      new Uint8Array(
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=",
          "base64",
        ),
      ),
    );
  });
});
