import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, resolveWorkspaceMember, workspace } from "@vyzer/db";
import { createRouter, router } from "./router";

/**
 * Stage 3.6 (Relations and links) contract draft, per Time B:
 * `relation.add({issueId, relatedIssueId, type})`, type `blocks | related | duplicate`.
 * `blocks` is directed (issueId blocks relatedIssueId — the second Issue's `blockedBy`,
 * the first Issue's `blocking`); `duplicate` is directed (issueId is the duplicate,
 * relatedIssueId is canonical, and adding moves the duplicate to the Team's `duplicate`
 * category Status); `related` is symmetric. `relation.remove` takes the same triple;
 * removing a duplicate relation does not revert the Status. Self-relations and
 * cross-Workspace endpoints are rejected. `issue.get` gains
 * `relations: {blockedBy, blocking, related, duplicateOf}`, each a `{id, identifier, title}[]`;
 * `issue.events` records `relation_added`/`relation_removed` on both sides. `add`/`remove`
 * return void.
 * `link.add({issueId, url, title?})` requires an http/https URL and an in-Workspace Issue;
 * `link.remove({id})`. `issue.get` gains `links: {id, issueId, url, title, creatorId,
 * createdAt}[]`. Any Workspace Member can add/remove relations and links.
 */

function testDatabaseUrl(): string {
  const fromProcess = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (fromProcess) return fromProcess;

  try {
    const rootEnv = parseEnv(readFileSync(new URL("../../../.env", import.meta.url), "utf8"));
    if (rootEnv.DATABASE_URL) return rootEnv.DATABASE_URL;
  } catch {
    // CI and local runners can provide TEST_DATABASE_URL/DATABASE_URL directly.
  }

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Relation/Link tests.");
}

const db = createDb(testDatabaseUrl());
const api = createRouterClient(router, { context: { db, headers: new Headers() } });
const foreignWorkspaceIds: string[] = [];

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

/** Create a Team through the real API so it gets the seven default Statuses. */
async function createFixtureTeam(
  workspaceApi: ReturnType<typeof createWorkspaceApi>,
  namePrefix: string,
) {
  return workspaceApi.team.create({
    name: `${namePrefix} ${randomUUID()}`,
    key: uniqueTeamKey(),
    icon: { kind: "icon", name: "Layers", color: "purple" },
  });
}

afterEach(async () => {
  for (const workspaceId of foreignWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace-scoped Relation procedures", () => {
  it("relation.add(blocks) is directed: the blocker sees blocking, the blocked sees blockedBy", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Blocks Relation Team");
    const blocker = await ownerApi.issue.create({ team: created.slug, title: "Blocker" });
    const blocked = await ownerApi.issue.create({ team: created.slug, title: "Blocked" });

    await expect(
      ownerApi.relation.add({
        issueId: blocker.id,
        relatedIssueId: blocked.id,
        type: "blocks",
      }),
    ).resolves.toBeUndefined();

    const blockerView = await ownerApi.issue.get({ identifier: blocker.identifier });
    const blockedView = await ownerApi.issue.get({ identifier: blocked.identifier });
    expect(blockerView.relations.blocking).toEqual([
      expect.objectContaining({ id: blocked.id, identifier: blocked.identifier }),
    ]);
    expect(blockerView.relations.blockedBy).toEqual([]);
    expect(blockedView.relations.blockedBy).toEqual([
      expect.objectContaining({ id: blocker.id, identifier: blocker.identifier }),
    ]);
    expect(blockedView.relations.blocking).toEqual([]);
  });

  it("relation.add(related) is symmetric: both Issues see each other in related", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Related Relation Team");
    const issueA = await ownerApi.issue.create({ team: created.slug, title: "A" });
    const issueB = await ownerApi.issue.create({ team: created.slug, title: "B" });

    await ownerApi.relation.add({ issueId: issueA.id, relatedIssueId: issueB.id, type: "related" });

    const viewA = await ownerApi.issue.get({ identifier: issueA.identifier });
    const viewB = await ownerApi.issue.get({ identifier: issueB.identifier });
    expect(viewA.relations.related).toEqual([
      expect.objectContaining({ id: issueB.id, identifier: issueB.identifier }),
    ]);
    expect(viewB.relations.related).toEqual([
      expect.objectContaining({ id: issueA.id, identifier: issueA.identifier }),
    ]);
  });

  it("relation.add(duplicate) is directed and moves the duplicate Issue to the Team's Duplicate Status", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Duplicate Relation Team");
    const duplicateIssue = await ownerApi.issue.create({ team: created.slug, title: "Dup" });
    const canonicalIssue = await ownerApi.issue.create({ team: created.slug, title: "Canonical" });

    await ownerApi.relation.add({
      issueId: duplicateIssue.id,
      relatedIssueId: canonicalIssue.id,
      type: "duplicate",
    });

    const duplicateView = await ownerApi.issue.get({ identifier: duplicateIssue.identifier });
    expect(duplicateView.relations.duplicateOf).toEqual([
      expect.objectContaining({ id: canonicalIssue.id, identifier: canonicalIssue.identifier }),
    ]);
    expect(duplicateView.status.category).toBe("duplicate");
  });

  it("relation.remove(duplicate) clears the relation but does not revert the Status", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Duplicate Remove Team");
    const duplicateIssue = await ownerApi.issue.create({ team: created.slug, title: "Dup" });
    const canonicalIssue = await ownerApi.issue.create({ team: created.slug, title: "Canonical" });
    await ownerApi.relation.add({
      issueId: duplicateIssue.id,
      relatedIssueId: canonicalIssue.id,
      type: "duplicate",
    });

    await expect(
      ownerApi.relation.remove({
        issueId: duplicateIssue.id,
        relatedIssueId: canonicalIssue.id,
        type: "duplicate",
      }),
    ).resolves.toBeUndefined();

    const duplicateView = await ownerApi.issue.get({ identifier: duplicateIssue.identifier });
    expect(duplicateView.relations.duplicateOf).toEqual([]);
    expect(duplicateView.status.category).toBe("duplicate");
  });

  it("relation.remove(blocks) clears both sides", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Blocks Remove Team");
    const blocker = await ownerApi.issue.create({ team: created.slug, title: "Blocker" });
    const blocked = await ownerApi.issue.create({ team: created.slug, title: "Blocked" });
    await ownerApi.relation.add({
      issueId: blocker.id,
      relatedIssueId: blocked.id,
      type: "blocks",
    });

    await expect(
      ownerApi.relation.remove({
        issueId: blocker.id,
        relatedIssueId: blocked.id,
        type: "blocks",
      }),
    ).resolves.toBeUndefined();

    const blockerView = await ownerApi.issue.get({ identifier: blocker.identifier });
    const blockedView = await ownerApi.issue.get({ identifier: blocked.identifier });
    expect(blockerView.relations.blocking).toEqual([]);
    expect(blockedView.relations.blockedBy).toEqual([]);
  });

  it("relation.remove(related) clears the relation on both sides", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Related Remove Team");
    const issueA = await ownerApi.issue.create({ team: created.slug, title: "A" });
    const issueB = await ownerApi.issue.create({ team: created.slug, title: "B" });
    await ownerApi.relation.add({ issueId: issueA.id, relatedIssueId: issueB.id, type: "related" });

    await expect(
      ownerApi.relation.remove({
        issueId: issueA.id,
        relatedIssueId: issueB.id,
        type: "related",
      }),
    ).resolves.toBeUndefined();

    const viewA = await ownerApi.issue.get({ identifier: issueA.identifier });
    const viewB = await ownerApi.issue.get({ identifier: issueB.identifier });
    expect(viewA.relations.related).toEqual([]);
    expect(viewB.relations.related).toEqual([]);
  });

  it("relation.add rejects a self-relation for every type", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Self Relation Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Alone" });

    await expect(
      ownerApi.relation.add({ issueId: issue.id, relatedIssueId: issue.id, type: "related" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      ownerApi.relation.add({ issueId: issue.id, relatedIssueId: issue.id, type: "blocks" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      ownerApi.relation.add({ issueId: issue.id, relatedIssueId: issue.id, type: "duplicate" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("relation.add returns NOT_FOUND when issueId is outside the resolved Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Foreign IssueId Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Mine" });
    const foreignOwner = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreignOwner.workspaceId, foreignOwner.memberId);
    const foreignTeam = await createFixtureTeam(foreignApi, "Foreign Team");
    const foreignIssue = await foreignApi.issue.create({
      team: foreignTeam.slug,
      title: "Not yours",
    });

    await expect(
      ownerApi.relation.add({
        issueId: foreignIssue.id,
        relatedIssueId: issue.id,
        type: "related",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("relation.add rejects a relatedIssueId outside the resolved Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Foreign RelatedIssueId Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Mine" });
    const foreignOwner = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreignOwner.workspaceId, foreignOwner.memberId);
    const foreignTeam = await createFixtureTeam(foreignApi, "Foreign Team Two");
    const foreignIssue = await foreignApi.issue.create({
      team: foreignTeam.slug,
      title: "Not yours",
    });

    await expect(
      ownerApi.relation.add({
        issueId: issue.id,
        relatedIssueId: foreignIssue.id,
        type: "related",
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("relation.add allows a regular Workspace Member, not only Admin", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Relation Member Team");
    const issueA = await ownerApi.issue.create({ team: created.slug, title: "A" });
    const issueB = await ownerApi.issue.create({ team: created.slug, title: "B" });
    const regularMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const memberApi = createWorkspaceApi(owner.workspaceId, regularMember.id);

    await expect(
      memberApi.relation.add({
        issueId: issueA.id,
        relatedIssueId: issueB.id,
        type: "related",
      }),
    ).resolves.toBeUndefined();
  });

  it("relation.add records relation_added on both Issues; relation.remove records relation_removed on both", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Relation Events Team");
    const blocker = await ownerApi.issue.create({ team: created.slug, title: "Blocker" });
    const blocked = await ownerApi.issue.create({ team: created.slug, title: "Blocked" });

    await ownerApi.relation.add({
      issueId: blocker.id,
      relatedIssueId: blocked.id,
      type: "blocks",
    });
    const blockerEventsAfterAdd = await ownerApi.issue.events({ id: blocker.id });
    const blockedEventsAfterAdd = await ownerApi.issue.events({ id: blocked.id });
    expect(blockerEventsAfterAdd.map((event) => event.type)).toContain("relation_added");
    expect(blockedEventsAfterAdd.map((event) => event.type)).toContain("relation_added");

    await ownerApi.relation.remove({
      issueId: blocker.id,
      relatedIssueId: blocked.id,
      type: "blocks",
    });
    const blockerEventsAfterRemove = await ownerApi.issue.events({ id: blocker.id });
    const blockedEventsAfterRemove = await ownerApi.issue.events({ id: blocked.id });
    expect(blockerEventsAfterRemove.map((event) => event.type)).toContain("relation_removed");
    expect(blockedEventsAfterRemove.map((event) => event.type)).toContain("relation_removed");
  });
});

describe("Workspace-scoped Link procedures", () => {
  it("link.add persists an http(s) URL and exposes it through issue.get", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Link Add Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Linked" });

    await expect(
      ownerApi.link.add({
        issueId: issue.id,
        url: "https://example.test/pull/1",
        title: "PR #1",
      }),
    ).resolves.toBeUndefined();

    const fetched = await ownerApi.issue.get({ identifier: issue.identifier });
    expect(fetched.links).toEqual([
      expect.objectContaining({
        issueId: issue.id,
        url: "https://example.test/pull/1",
        title: "PR #1",
        creatorId: owner.memberId,
      }),
    ]);
  });

  it("link.add rejects a non-http(s) URL", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Link Scheme Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Linked" });

    await expect(
      ownerApi.link.add({ issueId: issue.id, url: "ftp://example.test/file" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(ownerApi.link.add({ issueId: issue.id, url: "not a url" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("link.add returns NOT_FOUND for an Issue outside the resolved Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);

    await expect(
      ownerApi.link.add({ issueId: randomUUID(), url: "https://example.test" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("link.remove deletes the link; returns NOT_FOUND for a foreign Workspace's link", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Link Remove Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Linked" });
    await ownerApi.link.add({ issueId: issue.id, url: "https://example.test/doc" });
    const fetched = await ownerApi.issue.get({ identifier: issue.identifier });
    const linkId = fetched.links[0]!.id;

    await expect(ownerApi.link.remove({ id: linkId })).resolves.toBeUndefined();
    const refetched = await ownerApi.issue.get({ identifier: issue.identifier });
    expect(refetched.links).toEqual([]);

    await expect(api.link.remove({ id: linkId })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("link.add allows a regular Workspace Member, not only Admin", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Link Member Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Linked" });
    const regularMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const memberApi = createWorkspaceApi(owner.workspaceId, regularMember.id);

    await expect(
      memberApi.link.add({ issueId: issue.id, url: "https://example.test/member" }),
    ).resolves.toBeUndefined();
  });
});
