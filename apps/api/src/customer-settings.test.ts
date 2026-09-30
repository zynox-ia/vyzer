import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, resolveWorkspaceMember, team, workspace } from "@vyzer/db";
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Customer settings tests.");
}

const db = createDb(testDatabaseUrl());
const workspaceIds: string[] = [];

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
    name: `Customer fixture ${suffix}`,
    slug: `customer-fixture-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  workspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Customer fixture member ${suffix}`,
    email: `${suffix}@example.test`,
    role,
  });

  return { workspaceId, memberId, api: createWorkspaceApi(workspaceId, memberId) };
}

async function createMemberApi(workspaceId: string) {
  const memberId = randomUUID();
  const suffix = randomUUID();
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Customer fixture member ${suffix}`,
    email: `${suffix}@example.test`,
    role: "member",
  });
  return createWorkspaceApi(workspaceId, memberId);
}

async function createTeam(workspaceId: string) {
  const id = randomUUID();
  const suffix = randomUUID();
  const slug = `customer-team-${suffix}`;
  await db.insert(team).values({
    id,
    workspaceId,
    name: `Customer Team ${suffix}`,
    slug,
    key: `C${suffix.replaceAll("-", "").slice(0, 6).toUpperCase()}`,
    icon: { kind: "icon", name: "Layers", color: "purple" },
  });
  return id;
}

afterEach(async () => {
  for (const workspaceId of workspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace-scoped Customer settings procedures", () => {
  it("lazily creates settings and default statuses, allows Member reads, and isolates Workspaces", async () => {
    const first = await createWorkspaceAndMember();
    const second = await createWorkspaceAndMember();
    const memberApi = await createMemberApi(first.workspaceId);

    const [before] = await db.$client<{ workspace_id: string }[]>`
      SELECT workspace_id FROM "customer_settings" WHERE workspace_id = ${first.workspaceId}
    `;
    expect(before).toBeUndefined();

    const settings = await first.api.customerSettings.get();
    expect(settings).toMatchObject({
      workspaceId: first.workspaceId,
      enabled: false,
      defaultTeamId: null,
      revenuePeriod: "annual",
      revenueCurrency: "USD",
      attributesDataSource: null,
      manualEditsEnabled: true,
    });
    await expect(first.api.customerSettings.get()).resolves.toEqual(settings);
    await expect(memberApi.customerSettings.get()).resolves.toEqual(settings);

    const statuses = await first.api.customerStatus.list();
    expect(statuses.map(({ name }) => name)).toEqual(["Active", "Prospect", "Churned", "Lost"]);
    expect(statuses.map(({ color }) => color)).toEqual(["purple", "green", "red", "orange"]);
    expect(statuses.map(({ position }) => position)).toEqual([0, 1, 2, 3]);
    await expect(memberApi.customerStatus.list()).resolves.toEqual(statuses);

    await expect(second.api.customerSettings.get()).resolves.toMatchObject({
      workspaceId: second.workspaceId,
      enabled: false,
      defaultTeamId: null,
    });
    await expect(second.api.customerStatus.list()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "Active" })]),
    );
    expect((await second.api.customerStatus.list()).map(({ id }) => id)).not.toEqual(
      statuses.map(({ id }) => id),
    );

    await expect(memberApi.customerSettings.update({ enabled: true })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("updates settings as Admin and rejects a default Team from another Workspace", async () => {
    const first = await createWorkspaceAndMember();
    const second = await createWorkspaceAndMember();
    const localTeamId = await createTeam(first.workspaceId);
    const foreignTeamId = await createTeam(second.workspaceId);

    await expect(
      first.api.customerSettings.update({ defaultTeamId: foreignTeamId }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(first.api.customerSettings.get()).resolves.toMatchObject({ defaultTeamId: null });

    const saved = await first.api.customerSettings.update({
      enabled: true,
      defaultTeamId: localTeamId,
      revenuePeriod: "monthly",
      revenueCurrency: "CAD",
      attributesDataSource: "Salesforce",
      manualEditsEnabled: false,
    });
    expect(saved).toMatchObject({
      enabled: true,
      defaultTeamId: localTeamId,
      revenuePeriod: "monthly",
      revenueCurrency: "CAD",
      attributesDataSource: "Salesforce",
      manualEditsEnabled: false,
    });
    await expect(first.api.customerSettings.get()).resolves.toEqual(saved);

    const memberApi = await createMemberApi(first.workspaceId);
    await expect(memberApi.customerSettings.get()).resolves.toEqual(saved);
    await expect(memberApi.customerSettings.update({ enabled: false })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await first.api.team.delete({ id: localTeamId });
    await expect(first.api.customerSettings.get()).resolves.toMatchObject({ defaultTeamId: null });

    await expect(second.api.customerSettings.update({ enabled: true })).resolves.toMatchObject({
      workspaceId: second.workspaceId,
      enabled: true,
    });
    await expect(first.api.customerSettings.get()).resolves.toMatchObject({ enabled: true });
  });

  it("validates, normalizes, scopes, and enforces unique domain rules per Workspace and kind", async () => {
    const first = await createWorkspaceAndMember();
    const second = await createWorkspaceAndMember();
    const memberApi = await createMemberApi(first.workspaceId);

    const domain = await first.api.customerDomainRule.add({
      kind: "excluded",
      value: "  Example.COM  ",
    });
    expect(domain.value).toBe("example.com");
    const email = await first.api.customerDomainRule.add({
      kind: "generic",
      value: " SALES@Example.COM ",
    });
    expect(email.value).toBe("sales@example.com");
    await expect(first.api.customerDomainRule.list({ kind: "excluded" })).resolves.toEqual([
      domain,
    ]);
    await expect(memberApi.customerDomainRule.list({ kind: "excluded" })).resolves.toEqual([
      domain,
    ]);

    await expect(
      first.api.customerDomainRule.add({ kind: "excluded", value: "HTTPS://example.com/path" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      first.api.customerDomainRule.add({ kind: "generic", value: "not an email" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      first.api.customerDomainRule.add({ kind: "excluded", value: "example.com" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const sameValueDifferentKind = await first.api.customerDomainRule.add({
      kind: "generic",
      value: "EXAMPLE.COM",
    });
    expect(sameValueDifferentKind.value).toBe("example.com");

    const otherDomain = await second.api.customerDomainRule.add({
      kind: "excluded",
      value: "example.com",
    });
    expect(otherDomain.value).toBe(domain.value);
    await expect(second.api.customerDomainRule.list({ kind: "excluded" })).resolves.toEqual([
      otherDomain,
    ]);
    await expect(first.api.customerDomainRule.list({ kind: "excluded" })).resolves.toEqual([
      domain,
    ]);

    await expect(
      memberApi.customerDomainRule.add({ kind: "excluded", value: "blocked.example" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(first.api.customerDomainRule.remove({ id: otherDomain.id })).rejects.toMatchObject(
      { code: "NOT_FOUND" },
    );
    await first.api.customerDomainRule.remove({ id: domain.id });
    await expect(first.api.customerDomainRule.list({ kind: "excluded" })).resolves.toEqual([]);
    await expect(second.api.customerDomainRule.list({ kind: "excluded" })).resolves.toEqual([
      otherDomain,
    ]);
    await expect(memberApi.customerDomainRule.remove({ id: email.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("supports Customer status CRUD and complete reorder, enforces Admin and preserves one status", async () => {
    const first = await createWorkspaceAndMember();
    const second = await createWorkspaceAndMember();
    const memberApi = await createMemberApi(first.workspaceId);
    const initial = await first.api.customerStatus.list();
    const initialStatus = initial[0];
    expect(initialStatus).toBeDefined();
    if (!initialStatus) throw new Error("Expected seeded Customer statuses.");

    const created = await first.api.customerStatus.create({
      name: "  Evaluating  ",
      color: "blue",
    });
    expect(created).toMatchObject({ name: "Evaluating", color: "blue", position: 4 });
    const updated = await first.api.customerStatus.update({
      id: created.id,
      name: "Evaluating further",
      color: "purple",
    });
    expect(updated).toMatchObject({
      id: created.id,
      name: "Evaluating further",
      color: "purple",
    });
    await expect(
      first.api.customerStatus.create({ name: " active ", color: "green" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const reorderedIds = [created.id, ...initial.map(({ id }) => id).reverse()];
    await first.api.customerStatus.reorder({ ids: reorderedIds });
    await expect(first.api.customerStatus.list()).resolves.toMatchObject(
      reorderedIds.map((id, position) => ({ id, position })),
    );
    await expect(
      first.api.customerStatus.reorder({ ids: reorderedIds.slice(1) }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      first.api.customerStatus.reorder({ ids: [...reorderedIds, randomUUID()] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const foreignStatus = (await second.api.customerStatus.list())[0];
    expect(foreignStatus).toBeDefined();
    if (!foreignStatus)
      throw new Error("Expected seeded Customer statuses in the second Workspace.");
    await expect(
      first.api.customerStatus.update({ id: foreignStatus.id, name: "Hidden" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(first.api.customerStatus.delete({ id: foreignStatus.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      memberApi.customerStatus.create({ name: "Blocked", color: "red" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      memberApi.customerStatus.update({ id: initialStatus.id, color: "red" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(memberApi.customerStatus.delete({ id: initialStatus.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(memberApi.customerStatus.reorder({ ids: reorderedIds })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await first.api.customerStatus.delete({ id: created.id });
    await expect(first.api.customerStatus.list()).resolves.toHaveLength(initial.length);
    const remaining = await first.api.customerStatus.list();
    const targetStatus = remaining[0];
    expect(targetStatus).toBeDefined();
    if (!targetStatus) throw new Error("Expected one Customer status to remain.");
    for (const status of remaining.slice(1)) {
      await first.api.customerStatus.delete({ id: status.id, moveTo: targetStatus.id });
    }
    await expect(first.api.customerStatus.delete({ id: targetStatus.id })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    await expect(
      first.api.customerStatus.delete({ id: randomUUID(), moveTo: targetStatus.id }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    // C1 has no Customer table, so no status can yet be exercised as in use.
  });

  it("supports Customer tier CRUD and complete reorder, with Workspace isolation", async () => {
    const first = await createWorkspaceAndMember();
    const second = await createWorkspaceAndMember();
    const memberApi = await createMemberApi(first.workspaceId);
    await expect(first.api.customerTier.list()).resolves.toEqual([]);
    await expect(memberApi.customerTier.list()).resolves.toEqual([]);

    const priority = await first.api.customerTier.create({ name: "Priority", color: "amber" });
    const standard = await first.api.customerTier.create({ name: "Standard", color: "grey" });
    expect([priority.position, standard.position]).toEqual([0, 1]);
    const updated = await first.api.customerTier.update({
      id: priority.id,
      name: "Strategic",
      color: "purple",
    });
    expect(updated).toMatchObject({ id: priority.id, name: "Strategic", color: "purple" });

    await first.api.customerTier.reorder({ ids: [standard.id, priority.id] });
    await expect(first.api.customerTier.list()).resolves.toMatchObject([
      { id: standard.id, position: 0 },
      { id: priority.id, position: 1 },
    ]);
    await expect(
      first.api.customerTier.reorder({ ids: [priority.id, priority.id] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    const foreignTier = await second.api.customerTier.create({ name: "Foreign", color: "cyan" });
    await expect(
      first.api.customerTier.update({ id: foreignTier.id, name: "Changed" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(first.api.customerTier.delete({ id: foreignTier.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(
      memberApi.customerTier.create({ name: "Blocked", color: "red" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      memberApi.customerTier.update({ id: priority.id, color: "red" }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(memberApi.customerTier.delete({ id: priority.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(
      memberApi.customerTier.reorder({ ids: [standard.id, priority.id] }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await first.api.customerTier.delete({ id: standard.id });
    await expect(first.api.customerTier.list()).resolves.toEqual([
      expect.objectContaining({ id: priority.id, name: "Strategic" }),
    ]);
    await first.api.customerTier.delete({ id: priority.id });
    await expect(first.api.customerTier.list()).resolves.toEqual([]);
    await expect(second.api.customerTier.list()).resolves.toEqual([
      expect.objectContaining({ id: foreignTier.id, name: "Foreign" }),
    ]);
  });
});
