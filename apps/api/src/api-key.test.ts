import { createHash, randomBytes, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import {
  apiKey,
  createDb,
  member,
  MEMBER_ID,
  resolveWorkspaceMember,
  WORKSPACE_ID,
  workspace,
  type ApiKeyPermissions,
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run API key tests.");
}

const db = createDb(testDatabaseUrl());
const api = createRouterClient(router, { context: { db, headers: new Headers() } });
type ApiTestClient = typeof api;
const fixtureWorkspaceIds: string[] = [];
const fixtureMemberIds: string[] = [];
const fixtureApiKeyIds: string[] = [];

function createApiForMember(workspaceId: string, memberId: string) {
  return createRouterClient(
    createRouter((currentDb) => resolveWorkspaceMember(currentDb, workspaceId, memberId)),
    { context: { db, headers: new Headers() } },
  );
}

function createBearerApi(token: string) {
  return createRouterClient(router, {
    context: { db, headers: new Headers({ Authorization: `Bearer ${token}` }) },
  });
}

async function createMember(workspaceId: string, role: "admin" | "member" = "member") {
  const id = randomUUID();
  const suffix = randomUUID();
  const fixture = {
    id,
    workspaceId,
    name: `API key fixture ${suffix}`,
    email: `${suffix}@example.test`,
    role,
  };
  await db.insert(member).values(fixture);
  fixtureMemberIds.push(id);
  return fixture;
}

async function createForeignWorkspace(role: "admin" | "member" = "admin") {
  const workspaceId = randomUUID();
  const suffix = randomUUID();
  await db.insert(workspace).values({
    id: workspaceId,
    name: `API key fixture ${suffix}`,
    slug: `api-key-fixture-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  fixtureWorkspaceIds.push(workspaceId);
  const fixtureMember = await createMember(workspaceId, role);
  return { workspaceId, member: fixtureMember };
}

async function createApiKey(
  client: ApiTestClient,
  permissions: "full" | Array<"read" | "write" | "issues:create" | "comments:create" | "admin">,
  name = `Fixture key ${randomUUID()}`,
) {
  const created = await client.apiKey.create({ name, permissions });
  fixtureApiKeyIds.push(created.key.id);
  return created;
}

afterEach(async () => {
  for (const keyId of fixtureApiKeyIds.splice(0)) {
    await db.$client`DELETE FROM "api_key" WHERE id = ${keyId}`;
  }
  for (const memberId of fixtureMemberIds.splice(0)) {
    await db.$client`DELETE FROM "member" WHERE id = ${memberId}`;
  }
  for (const workspaceId of fixtureWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("API key procedures", () => {
  it("returns the raw token once and persists only its SHA-256 hash and prefix", async () => {
    const created = await createApiKey(api, ["read"]);
    const [persisted] = await db.$client<
      {
        token_prefix: string;
        token_hash: string;
        permissions: ApiKeyPermissions;
        row: Record<string, unknown>;
      }[]
    >`
      SELECT token_prefix, token_hash, permissions, to_jsonb(api_key) AS row
      FROM "api_key" WHERE id = ${created.key.id}
    `;

    expect(created.token).toMatch(/^vyz_[A-Za-z0-9_-]{43}$/);
    expect(created.key.tokenPrefix).toBe(created.token.slice(0, 8));
    expect(persisted).toMatchObject({
      token_prefix: created.token.slice(0, 8),
      token_hash: createHash("sha256").update(created.token).digest("hex"),
      permissions: ["read"],
    });
    expect(JSON.stringify(persisted?.row)).not.toContain(created.token);
    expect(created.key).not.toHaveProperty("token");
    expect(await api.apiKey.list({ scope: "mine" })).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ token: created.token })]),
    );
  });

  it("resolves a valid Bearer key, throttles last-used writes, and keeps seed fallback", async () => {
    const created = await createApiKey(api, ["read"]);
    const [unused] = await db.$client<{ last_used_at: string | null }[]>`
      SELECT last_used_at FROM "api_key" WHERE id = ${created.key.id}
    `;
    expect(unused?.last_used_at).toBeNull();

    const authenticated = await createBearerApi(created.token).workspace.current();
    const [firstUse] = await db.$client<{ last_used_at: string | null }[]>`
      SELECT last_used_at FROM "api_key" WHERE id = ${created.key.id}
    `;
    expect(firstUse?.last_used_at).not.toBeNull();
    expect(Date.parse(firstUse?.last_used_at ?? "")).not.toBeNaN();

    await createBearerApi(created.token).workspace.current();
    const [secondUse] = await db.$client<{ last_used_at: string | null }[]>`
      SELECT last_used_at FROM "api_key" WHERE id = ${created.key.id}
    `;

    const fallback = await api.workspace.current();

    expect(authenticated.member.id).toBe(created.key.memberId);
    expect(authenticated.workspace.id).toBe(WORKSPACE_ID);
    expect(secondUse?.last_used_at).toEqual(firstUse?.last_used_at);
    expect(fallback.member.id).toBe(MEMBER_ID);
    expect(fallback.member.role).toBe("admin");
  });

  it("rejects malformed, unknown, and revoked Bearer keys without falling back to the seed", async () => {
    const unknownToken = `vyz_${Buffer.alloc(32, 1).toString("base64url")}`;
    await expect(createBearerApi(unknownToken).workspace.current()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
    await expect(createBearerApi("not-a-vyzer-key").workspace.current()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });

    const created = await createApiKey(api, ["read"]);
    await api.apiKey.revoke({ id: created.key.id });
    await expect(createBearerApi(created.token).workspace.current()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("enforces read and write capabilities, and caps admin keys at the Member role", async () => {
    const readKey = await createApiKey(api, ["read"]);
    const readClient = createBearerApi(readKey.token);

    await expect(readClient.apiKey.list({ scope: "mine" })).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: readKey.key.id })]),
    );
    await expect(readClient.apiKey.revoke({ id: readKey.key.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    const writeKey = await createApiKey(api, ["write"]);
    const writeCreated = await createApiKey(createBearerApi(writeKey.token), ["read"]);
    expect(writeCreated.key.memberId).toBe(writeKey.key.memberId);

    const adminFixture = await createForeignWorkspace("admin");
    const ordinaryMember = await createMember(adminFixture.workspaceId);
    const memberToken = `vyz_${randomBytes(32).toString("base64url")}`;
    const [memberAdminKey] = await db
      .insert(apiKey)
      .values({
        workspaceId: adminFixture.workspaceId,
        memberId: ordinaryMember.id,
        name: "Admin capability role cap fixture",
        tokenPrefix: memberToken.slice(0, 8),
        tokenHash: createHash("sha256").update(memberToken).digest("hex"),
        permissions: ["admin"],
      })
      .returning({ id: apiKey.id });
    if (memberAdminKey) fixtureApiKeyIds.push(memberAdminKey.id);
    await expect(
      createBearerApi(memberToken).workspace.update({ name: "Should stay unchanged" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const adminApi = createApiForMember(adminFixture.workspaceId, adminFixture.member.id);
    const adminKey = await createApiKey(adminApi, "full");
    const updated = await createBearerApi(adminKey.token).workspace.update({
      name: `Updated by API key ${randomUUID()}`,
    });
    expect(updated.name).toContain("Updated by API key");
  });

  it("rejects admin and full key creation by a non-admin Member without persisting keys", async () => {
    const ordinaryMember = await createMember(WORKSPACE_ID);
    const memberApi = createApiForMember(WORKSPACE_ID, ordinaryMember.id);

    await expect(
      memberApi.apiKey.create({
        name: "Blocked admin permission",
        permissions: ["admin"],
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      memberApi.apiKey.create({
        name: "Blocked full permission",
        permissions: "full",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const [persisted] = await db.$client<{ count: string }[]>`
      SELECT count(*)::text AS count FROM "api_key" WHERE member_id = ${ordinaryMember.id}
    `;
    expect(persisted?.count).toBe("0");
  });

  it("lets a key owner edit name and permissions after the Workspace restricts creation", async () => {
    const fixture = await createForeignWorkspace("admin");
    const owner = await createMember(fixture.workspaceId);
    const ownerApi = createApiForMember(fixture.workspaceId, owner.id);
    const adminApi = createApiForMember(fixture.workspaceId, fixture.member.id);
    const created = await createApiKey(ownerApi, ["read"]);
    const originalHash = createHash("sha256").update(created.token).digest("hex");

    await adminApi.workspace.update({ apiKeyPolicy: "admins" });
    await ownerApi.apiKey.update({
      id: created.key.id,
      name: "Updated owner key",
      permissions: ["write"],
    });

    const [persisted] = await db.$client<
      { name: string; token_prefix: string; token_hash: string; permissions: ApiKeyPermissions }[]
    >`
      SELECT name, token_prefix, token_hash, permissions
      FROM "api_key" WHERE id = ${created.key.id}
    `;
    expect(persisted).toEqual({
      name: "Updated owner key",
      token_prefix: created.token.slice(0, 8),
      token_hash: originalHash,
      permissions: ["write"],
    });
    await expect(createBearerApi(created.token).workspace.current()).resolves.toMatchObject({
      member: { id: owner.id },
    });
  });

  it("prevents a non-admin key owner from updating permissions to admin or full", async () => {
    const fixture = await createForeignWorkspace("admin");
    const owner = await createMember(fixture.workspaceId);
    const ownerApi = createApiForMember(fixture.workspaceId, owner.id);
    const created = await createApiKey(ownerApi, ["read"]);

    await expect(
      ownerApi.apiKey.update({
        id: created.key.id,
        name: created.key.name,
        permissions: ["admin"],
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      ownerApi.apiKey.update({
        id: created.key.id,
        name: created.key.name,
        permissions: "full",
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const [persisted] = await db.$client<{ name: string; permissions: ApiKeyPermissions }[]>`
      SELECT name, permissions FROM "api_key" WHERE id = ${created.key.id}
    `;
    expect(persisted).toEqual({ name: created.key.name, permissions: ["read"] });
  });

  it("does not let a non-admin Member edit another Member's API key", async () => {
    const fixture = await createForeignWorkspace("admin");
    const owner = await createMember(fixture.workspaceId);
    const otherMember = await createMember(fixture.workspaceId);
    const ownerApi = createApiForMember(fixture.workspaceId, owner.id);
    const otherMemberApi = createApiForMember(fixture.workspaceId, otherMember.id);
    const created = await createApiKey(ownerApi, ["read"]);

    await expect(
      otherMemberApi.apiKey.update({
        id: created.key.id,
        name: "Unauthorized rename",
        permissions: ["write"],
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const [persisted] = await db.$client<{ name: string; permissions: ApiKeyPermissions }[]>`
      SELECT name, permissions FROM "api_key" WHERE id = ${created.key.id}
    `;
    expect(persisted).toEqual({ name: created.key.name, permissions: ["read"] });
  });

  it("lets an Admin edit a Member's API key", async () => {
    const fixture = await createForeignWorkspace("admin");
    const owner = await createMember(fixture.workspaceId);
    const ownerApi = createApiForMember(fixture.workspaceId, owner.id);
    const adminApi = createApiForMember(fixture.workspaceId, fixture.member.id);
    const created = await createApiKey(ownerApi, ["read"]);

    await adminApi.apiKey.update({
      id: created.key.id,
      name: "Updated by workspace Admin",
      permissions: ["write"],
    });

    const [persisted] = await db.$client<{ name: string; permissions: ApiKeyPermissions }[]>`
      SELECT name, permissions FROM "api_key" WHERE id = ${created.key.id}
    `;
    expect(persisted).toEqual({ name: "Updated by workspace Admin", permissions: ["write"] });
  });

  it("returns NOT_FOUND when updating a revoked key or a key from another Workspace", async () => {
    const revokedKey = await createApiKey(api, ["read"]);
    await api.apiKey.revoke({ id: revokedKey.key.id });
    await expect(
      api.apiKey.update({
        id: revokedKey.key.id,
        name: "Cannot update revoked key",
        permissions: ["write"],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const foreign = await createForeignWorkspace("admin");
    const foreignApi = createApiForMember(foreign.workspaceId, foreign.member.id);
    const foreignKey = await createApiKey(foreignApi, ["read"]);
    await expect(
      api.apiKey.update({
        id: foreignKey.key.id,
        name: "Cannot update foreign key",
        permissions: ["write"],
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("scopes personal and workspace lists and revocation to the resolved Workspace", async () => {
    const ownKey = await createApiKey(api, ["read"]);
    const foreign = await createForeignWorkspace();
    const foreignApi = createApiForMember(foreign.workspaceId, foreign.member.id);
    const foreignKey = await createApiKey(foreignApi, ["read"]);

    const ownList = await api.apiKey.list({ scope: "mine" });
    const workspaceList = await api.apiKey.list({ scope: "workspace" });
    const foreignList = await foreignApi.apiKey.list({ scope: "workspace" });

    expect(ownList.map(({ id }) => id)).toContain(ownKey.key.id);
    expect(ownList.map(({ id }) => id)).not.toContain(foreignKey.key.id);
    expect(workspaceList.map(({ id }) => id)).not.toContain(foreignKey.key.id);
    expect(foreignList.map(({ id }) => id)).toContain(foreignKey.key.id);
    await expect(api.apiKey.revoke({ id: foreignKey.key.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    expect((await foreignApi.apiKey.list({ scope: "workspace" })).map(({ id }) => id)).toContain(
      foreignKey.key.id,
    );
  });

  it("applies all_members by default and restricts creation to admins under admins policy", async () => {
    const adminFixture = await createForeignWorkspace("admin");
    const adminApi = createApiForMember(adminFixture.workspaceId, adminFixture.member.id);
    const ordinaryMember = await createMember(adminFixture.workspaceId);
    const memberApi = createApiForMember(adminFixture.workspaceId, ordinaryMember.id);

    const initial = await adminApi.workspace.current();
    expect(initial.workspace.apiKeyPolicy).toBe("all_members");

    const memberKey = await createApiKey(memberApi, ["read"]);
    expect(memberKey.key.memberId).toBe(ordinaryMember.id);

    await adminApi.workspace.update({ apiKeyPolicy: "admins" });
    await expect(createApiKey(memberApi, ["read"])).rejects.toMatchObject({ code: "FORBIDDEN" });

    const adminKey = await createApiKey(adminApi, ["read"]);
    expect(adminKey.key.memberId).not.toBe(ordinaryMember.id);
    const updated = await adminApi.workspace.current();
    expect(updated.workspace.apiKeyPolicy).toBe("admins");
  });
});
