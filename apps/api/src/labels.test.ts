import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, resolveWorkspaceMember, workspace } from "@vyzer/db";
import { createRouter, router } from "./router";

/**
 * Stage 3.5 (Label) contract draft, confirmed by Time B:
 * `label.list({team?})` — Workspace Labels, plus the Team's when `team` is given.
 * `label.create({team?, parentId?, isGroup?, name, description?, color?})`,
 * `label.update({id, name?, description?, color?})`, `label.archive({id})`,
 * `label.delete({id}) -> {deletedIssueCount}`, `label.merge({sourceId, targetId})`,
 * `label.convertToGroup({id, childName?})`, `label.move({id, team: string | null})` — all
 * Admin-only. `issue.setLabels({id, labelIds})` — any Member. `issue.list`/`issue.get` carry
 * `labels`; `issue.list` filters by `filters.labelIds`, groups by `groupBy: "label"`;
 * `issue.facets` exposes `facets.labels` including unused Labels (count 0). Reserved/duplicate
 * names -> BAD_REQUEST/CONFLICT; a Label group allows up to 250 children; applying an archived
 * or group Label, an out-of-scope Label, or two children of the same group -> BAD_REQUEST.
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Label tests.");
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

async function issueLabelIds(issueId: string): Promise<string[]> {
  const rows = await db.$client<{ label_id: string }[]>`
    SELECT label_id FROM "issue_label" WHERE issue_id = ${issueId}
  `;
  return rows.map((row) => row.label_id).sort();
}

type LabelRow = {
  id: string;
  team_id: string | null;
  parent_id: string | null;
  is_group: boolean;
  archived_at: Date | null;
};

async function labelRow(id: string): Promise<LabelRow | null> {
  const [row] = await db.$client<LabelRow[]>`
    SELECT id, team_id, parent_id, is_group, archived_at FROM "label" WHERE id = ${id}
  `;
  return row ?? null;
}

afterEach(async () => {
  for (const workspaceId of foreignWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace-scoped Label procedures", () => {
  it("label.create at the Workspace scope when no team is given", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);

    const created = await ownerApi.label.create({ name: "Design" });

    expect(created).toMatchObject({ name: "Design", teamId: null, isGroup: false });
  });

  it("label.create at a Team's scope when team is given", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Team Scope Team");

    const label = await ownerApi.label.create({ team: created.slug, name: "QA" });

    expect(label.teamId).toBe(created.id);
  });

  it("label.create as a group, then a child via parentId inherits the group's Team scope", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Group Team");
    const group = await ownerApi.label.create({
      team: created.slug,
      isGroup: true,
      name: "Priority Area",
    });

    const child = await ownerApi.label.create({ parentId: group.id, name: "Frontend" });

    expect(child.parentId).toBe(group.id);
    expect(child.teamId).toBe(created.id);
    expect(child.isGroup).toBe(false);
  });

  it("label.create rejects a reserved name", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);

    await expect(ownerApi.label.create({ name: "priority" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("label.create rejects a duplicate name within the same scope, but allows it across scopes", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Duplicate Scope Team");
    await ownerApi.label.create({ name: "Design" });

    await expect(ownerApi.label.create({ name: "Design" })).rejects.toMatchObject({
      code: "CONFLICT",
    });
    // Same name is fine when it belongs to a different scope (Team vs Workspace).
    await expect(
      ownerApi.label.create({ team: created.slug, name: "Design" }),
    ).resolves.toMatchObject({ name: "Design", teamId: created.id });
  });

  it("label.create rejects a child that is itself a group", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const group = await ownerApi.label.create({ isGroup: true, name: "Area" });

    await expect(
      ownerApi.label.create({ parentId: group.id, isGroup: true, name: "Nested group" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("label.create rejects adding a child to an archived group", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const group = await ownerApi.label.create({ isGroup: true, name: "Retiring group" });
    await ownerApi.label.archive({ id: group.id });

    await expect(
      ownerApi.label.create({ parentId: group.id, name: "Too late" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("label.create rejects non-admin Members with FORBIDDEN", async () => {
    const owner = await createWorkspaceAndMember();
    const regularMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const memberApi = createWorkspaceApi(owner.workspaceId, regularMember.id);

    await expect(memberApi.label.create({ name: "Not allowed" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("label.list returns NOT_FOUND for a Team outside the resolved Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label List Isolation Team");

    await expect(api.label.list({ team: created.slug })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("label.list includes issueCount and lastAppliedAt", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label List Counts Team");
    const label = await ownerApi.label.create({ name: "Counted" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Tagged" });
    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [label.id] });

    const listed = await ownerApi.label.list({});
    const found = listed.find((row) => row.id === label.id);

    expect(found?.issueCount).toBe(1);
    expect(found?.lastAppliedAt).not.toBeNull();
  });

  it("label.update edits name/description/color and rejects a reserved name", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const label = await ownerApi.label.create({ name: "Old name" });

    const updated = await ownerApi.label.update({
      id: label.id,
      name: "New name",
      description: "A description",
      color: "green",
    });
    expect(updated).toMatchObject({
      name: "New name",
      description: "A description",
      color: "green",
    });

    await expect(ownerApi.label.update({ id: label.id, name: "status" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("label.update rejects non-admin Members with FORBIDDEN", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const label = await ownerApi.label.create({ name: "Guarded" });
    const regularMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const memberApi = createWorkspaceApi(owner.workspaceId, regularMember.id);

    await expect(memberApi.label.update({ id: label.id, name: "Hijacked" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("label.archive on a group also archives its children, but keeps existing Issue assignments", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Archive Group Team");
    const group = await ownerApi.label.create({ isGroup: true, name: "Area" });
    const child = await ownerApi.label.create({ parentId: group.id, name: "Backend" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Already tagged" });
    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [child.id] });

    await expect(ownerApi.label.archive({ id: group.id })).resolves.toMatchObject({
      id: group.id,
    });

    const archivedChild = await labelRow(child.id);
    expect(archivedChild?.archived_at).not.toBeNull();
    expect(await issueLabelIds(issue.id)).toEqual([child.id]);
  });

  it("issue.setLabels rejects newly applying an archived Label, but keeps an already-applied one", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Archive Apply Team");
    const label = await ownerApi.label.create({ name: "Will be archived" });
    const other = await ownerApi.label.create({ name: "Still usable" });
    const issueWithLabel = await ownerApi.issue.create({
      team: created.slug,
      title: "Already has it",
    });
    await ownerApi.issue.setLabels({ id: issueWithLabel.id, labelIds: [label.id] });
    await ownerApi.label.archive({ id: label.id });

    // Adding another Label while keeping the already-applied archived one is not "newly applying" it.
    await expect(
      ownerApi.issue.setLabels({
        id: issueWithLabel.id,
        labelIds: [label.id, other.id],
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: label.id }),
        expect.objectContaining({ id: other.id }),
      ]),
    );

    const freshIssue = await ownerApi.issue.create({ team: created.slug, title: "Never had it" });
    await expect(
      ownerApi.issue.setLabels({ id: freshIssue.id, labelIds: [label.id] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("label.delete removes the Label and reports how many Issues referenced it", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Delete Team");
    const label = await ownerApi.label.create({ name: "Disposable" });
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "One" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Two" });
    await ownerApi.issue.setLabels({ id: issueOne.id, labelIds: [label.id] });
    await ownerApi.issue.setLabels({ id: issueTwo.id, labelIds: [label.id] });

    await expect(ownerApi.label.delete({ id: label.id })).resolves.toEqual({
      deletedIssueCount: 2,
    });
    expect(await labelRow(label.id)).toBeNull();
  });

  it("label.delete on a group also deletes its children and counts Issues via the children", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Delete Group Team");
    const group = await ownerApi.label.create({ isGroup: true, name: "Area" });
    const child = await ownerApi.label.create({ parentId: group.id, name: "Backend" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Tagged" });
    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [child.id] });

    await expect(ownerApi.label.delete({ id: group.id })).resolves.toEqual({
      deletedIssueCount: 1,
    });
    expect(await labelRow(group.id)).toBeNull();
    expect(await labelRow(child.id)).toBeNull();
  });

  it("label.merge moves Issue assignments to the target and removes the source", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Merge Team");
    const source = await ownerApi.label.create({ name: "Duplicate Concept" });
    const target = await ownerApi.label.create({ name: "Canonical Concept" });
    const onlySource = await ownerApi.issue.create({ team: created.slug, title: "Only source" });
    const overlapping = await ownerApi.issue.create({ team: created.slug, title: "Overlapping" });
    await ownerApi.issue.setLabels({ id: onlySource.id, labelIds: [source.id] });
    await ownerApi.issue.setLabels({ id: overlapping.id, labelIds: [source.id, target.id] });

    const merged = await ownerApi.label.merge({ sourceId: source.id, targetId: target.id });

    expect(merged.id).toBe(target.id);
    expect(await labelRow(source.id)).toBeNull();
    expect(await issueLabelIds(onlySource.id)).toEqual([target.id]);
    expect(await issueLabelIds(overlapping.id)).toEqual([target.id]);
  });

  it("label.merge rejects merging across scopes, into itself, or into a group", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Merge Rules Team");
    const workspaceLabel = await ownerApi.label.create({ name: "Workspace scoped" });
    const teamLabel = await ownerApi.label.create({ team: created.slug, name: "Team scoped" });
    const group = await ownerApi.label.create({ isGroup: true, name: "A group" });

    await expect(
      ownerApi.label.merge({ sourceId: workspaceLabel.id, targetId: teamLabel.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      ownerApi.label.merge({ sourceId: workspaceLabel.id, targetId: workspaceLabel.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(
      ownerApi.label.merge({ sourceId: group.id, targetId: workspaceLabel.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("label.convertToGroup requires a childName when the Label already has Issue assignments", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Convert Requires Child Team");
    const label = await ownerApi.label.create({ name: "In use" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Tagged" });
    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [label.id] });

    await expect(ownerApi.label.convertToGroup({ id: label.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("label.convertToGroup without existing assignments returns just the group", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const label = await ownerApi.label.create({ name: "Unused" });

    const result = await ownerApi.label.convertToGroup({ id: label.id });

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: label.id, isGroup: true });
  });

  it("label.convertToGroup with childName migrates existing assignments to the new child", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Convert Migrates Team");
    const label = await ownerApi.label.create({ name: "Legacy" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Tagged" });
    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [label.id] });

    const [group, child] = await ownerApi.label.convertToGroup({
      id: label.id,
      childName: "Legacy child",
    });

    expect(group).toMatchObject({ id: label.id, isGroup: true });
    expect(child?.parentId).toBe(label.id);
    expect(await issueLabelIds(issue.id)).toEqual([child!.id]);
  });

  it("label.convertToGroup rejects a Label that is already a group or is itself a child", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const group = await ownerApi.label.create({ isGroup: true, name: "Already a group" });
    const child = await ownerApi.label.create({ parentId: group.id, name: "A child" });

    await expect(ownerApi.label.convertToGroup({ id: group.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(ownerApi.label.convertToGroup({ id: child.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("label.move moves a Workspace Label into a Team, and back to the Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Move Team");
    const label = await ownerApi.label.create({ name: "Movable" });

    const movedIn = await ownerApi.label.move({ id: label.id, team: created.slug });
    expect(movedIn[0]?.teamId).toBe(created.id);

    const movedOut = await ownerApi.label.move({ id: label.id, team: null });
    expect(movedOut[0]?.teamId).toBeNull();
  });

  it("label.move on a group also moves its children", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Label Move Group Team");
    const group = await ownerApi.label.create({ isGroup: true, name: "Area" });
    const child = await ownerApi.label.create({ parentId: group.id, name: "Backend" });

    await ownerApi.label.move({ id: group.id, team: created.slug });

    expect((await labelRow(group.id))?.team_id).toBe(created.id);
    expect((await labelRow(child.id))?.team_id).toBe(created.id);
  });

  it("label.move rejects moving a Label into a Team when it is assigned to Issues outside that Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const teamA = await createFixtureTeam(ownerApi, "Label Move Team A");
    const teamB = await createFixtureTeam(ownerApi, "Label Move Team B");
    const label = await ownerApi.label.create({ name: "Cross-Team tagged" });
    const issueInA = await ownerApi.issue.create({ team: teamA.slug, title: "Tagged in A" });
    await ownerApi.issue.setLabels({ id: issueInA.id, labelIds: [label.id] });

    await expect(ownerApi.label.move({ id: label.id, team: teamB.slug })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("label.merge/convertToGroup/move/archive/delete reject non-admin Members with FORBIDDEN", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const labelA = await ownerApi.label.create({ name: "Guard A" });
    const labelB = await ownerApi.label.create({ name: "Guard B" });
    const regularMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const memberApi = createWorkspaceApi(owner.workspaceId, regularMember.id);

    await expect(
      memberApi.label.merge({ sourceId: labelA.id, targetId: labelB.id }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(memberApi.label.convertToGroup({ id: labelA.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(memberApi.label.move({ id: labelA.id, team: null })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(memberApi.label.archive({ id: labelA.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(memberApi.label.delete({ id: labelA.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("issue.setLabels allows a regular Member (not only Admin) to apply Labels", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Set Labels Member Team");
    const label = await ownerApi.label.create({ name: "Member-applied" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Taggable" });
    const regularMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const memberApi = createWorkspaceApi(owner.workspaceId, regularMember.id);

    await expect(
      memberApi.issue.setLabels({ id: issue.id, labelIds: [label.id] }),
    ).resolves.toEqual([expect.objectContaining({ id: label.id })]);
  });

  it("issue.setLabels rejects more than one child from the same group", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Set Labels One Per Group Team");
    const group = await ownerApi.label.create({ isGroup: true, name: "Area" });
    const childA = await ownerApi.label.create({ parentId: group.id, name: "Frontend" });
    const childB = await ownerApi.label.create({ parentId: group.id, name: "Backend" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Taggable" });

    await expect(
      ownerApi.issue.setLabels({ id: issue.id, labelIds: [childA.id, childB.id] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("issue.setLabels rejects applying a group Label directly", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Set Labels No Group Team");
    const group = await ownerApi.label.create({ isGroup: true, name: "Area" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Taggable" });

    await expect(
      ownerApi.issue.setLabels({ id: issue.id, labelIds: [group.id] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("issue.setLabels rejects a Label scoped to a different Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const teamA = await createFixtureTeam(ownerApi, "Set Labels Team A");
    const teamB = await createFixtureTeam(ownerApi, "Set Labels Team B");
    const teamBLabel = await ownerApi.label.create({ team: teamB.slug, name: "Only in B" });
    const issueInA = await ownerApi.issue.create({ team: teamA.slug, title: "Taggable" });

    await expect(
      ownerApi.issue.setLabels({ id: issueInA.id, labelIds: [teamBLabel.id] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("issue.setLabels rejects a Label id that does not belong to the resolved Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Set Labels Foreign Workspace Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Taggable" });
    const foreignOwner = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreignOwner.workspaceId, foreignOwner.memberId);
    const foreignLabel = await foreignApi.label.create({ name: "Not yours" });

    await expect(
      ownerApi.issue.setLabels({ id: issue.id, labelIds: [foreignLabel.id] }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("issue.setLabels replaces the previous set and records label_added/label_removed events", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Set Labels Replace Team");
    const labelA = await ownerApi.label.create({ name: "First" });
    const labelB = await ownerApi.label.create({ name: "Second" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Taggable" });
    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [labelA.id] });

    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [labelB.id] });

    expect(await issueLabelIds(issue.id)).toEqual([labelB.id]);
    const events = await ownerApi.issue.events({ id: issue.id });
    expect(events.map((event) => event.type)).toEqual(
      expect.arrayContaining(["label_added", "label_removed"]),
    );
  });

  it("issue.get and issue.list expose the labels array", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Labels On Issue Team");
    const label = await ownerApi.label.create({ name: "Visible" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Taggable" });
    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [label.id] });

    const fetched = await ownerApi.issue.get({ identifier: issue.identifier });
    expect(fetched.labels).toEqual([expect.objectContaining({ id: label.id, name: "Visible" })]);

    const listed = await ownerApi.issue.list({ team: created.slug, view: "all" });
    const listedRow = listed.find((row) => row.id === issue.id);
    expect(listedRow?.labels).toEqual([expect.objectContaining({ id: label.id })]);
  });

  it("issue.list filters.labelIds narrows to Issues carrying any of the given Labels", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter LabelIds Team");
    const label = await ownerApi.label.create({ name: "Filterable" });
    const tagged = await ownerApi.issue.create({ team: created.slug, title: "Tagged" });
    await ownerApi.issue.setLabels({ id: tagged.id, labelIds: [label.id] });
    await ownerApi.issue.create({ team: created.slug, title: "Untagged" });

    const filtered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { labelIds: [label.id] },
    });

    expect(filtered.map((issue) => issue.id)).toEqual([tagged.id]);
  });

  it("issue.list groupBy=label keeps Issues sharing a Label contiguous", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Group By Label Team");
    const labelA = await ownerApi.label.create({ name: "Group A" });
    const labelB = await ownerApi.label.create({ name: "Group B" });
    const a1 = await ownerApi.issue.create({ team: created.slug, title: "A1" });
    await ownerApi.issue.setLabels({ id: a1.id, labelIds: [labelA.id] });
    const b1 = await ownerApi.issue.create({ team: created.slug, title: "B1" });
    await ownerApi.issue.setLabels({ id: b1.id, labelIds: [labelB.id] });
    const a2 = await ownerApi.issue.create({ team: created.slug, title: "A2" });
    await ownerApi.issue.setLabels({ id: a2.id, labelIds: [labelA.id] });

    const grouped = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      groupBy: "label",
    });
    const positions = new Map(grouped.map((issue, index) => [issue.id, index]));

    expect(Math.abs(positions.get(a1.id)! - positions.get(a2.id)!)).toBe(1);
  });

  it("issue.facets.labels includes every scoped Label, with count 0 when unused", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Facets Labels Team");
    const used = await ownerApi.label.create({ name: "Used" });
    const unused = await ownerApi.label.create({ name: "Unused" });
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Tagged" });
    await ownerApi.issue.setLabels({ id: issue.id, labelIds: [used.id] });

    const facets = await ownerApi.issue.facets({ team: created.slug, view: "all" });

    expect(facets.labels.find((row) => row.id === used.id)?.count).toBe(1);
    expect(facets.labels.find((row) => row.id === unused.id)?.count).toBe(0);
  });

  it("issue.update({teamId}) drops the source Team's Labels but keeps Workspace Labels, recording label_removed with teamMove:true", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const teamA = await createFixtureTeam(ownerApi, "Move Labels Team A");
    const teamB = await createFixtureTeam(ownerApi, "Move Labels Team B");
    const workspaceLabel = await ownerApi.label.create({ name: "Workspace wide" });
    const teamALabel = await ownerApi.label.create({ team: teamA.slug, name: "Only in A" });
    const issue = await ownerApi.issue.create({ team: teamA.slug, title: "Moving" });
    await ownerApi.issue.setLabels({
      id: issue.id,
      labelIds: [workspaceLabel.id, teamALabel.id],
    });

    const moved = await ownerApi.issue.update({ id: issue.id, teamId: teamB.id });

    const remainingLabelIds = await issueLabelIds(issue.id);
    expect(remainingLabelIds).toContain(workspaceLabel.id);
    expect(remainingLabelIds).not.toContain(teamALabel.id);
    expect(moved.teamId).toBe(teamB.id);

    const events = await ownerApi.issue.events({ id: issue.id });
    const teamMoveRemoval = events.find(
      (event) =>
        event.type === "label_removed" &&
        (event.payload as { labelId?: string }).labelId === teamALabel.id,
    );
    expect(teamMoveRemoval?.payload).toMatchObject({ teamMove: true });
  });
});
