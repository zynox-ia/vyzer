import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, resolveWorkspaceMember, workspace } from "@vyzer/db";
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

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Issue tests.");
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

type StatusRow = { id: string; name: string; category: string };

async function statusRowsForTeam(teamId: string): Promise<StatusRow[]> {
  return db.$client<StatusRow[]>`
    SELECT id, name, category FROM "workflow_status" WHERE team_id = ${teamId}
  `;
}

function getStatus(rows: StatusRow[], name: string): StatusRow {
  const found = rows.find((row) => row.name === name);
  if (!found) throw new Error(`Fixture Status "${name}" was not seeded.`);
  return found;
}

type IssueRow = {
  id: string;
  team_id: string;
  number: number;
  title: string;
  status_id: string;
  priority: number;
  assignee_id: string | null;
  sort_order: number;
  started_at: Date | null;
  completed_at: Date | null;
  canceled_at: Date | null;
};

async function issueRowsForTeam(teamId: string): Promise<IssueRow[]> {
  const rows = await db.$client<IssueRow[]>`
    SELECT id, team_id, number, title, status_id, priority, assignee_id, sort_order,
           started_at, completed_at, canceled_at
    FROM "issue" WHERE team_id = ${teamId}
  `;
  return rows.sort((a, b) => a.number - b.number);
}

type IssueEventRow = {
  id: string;
  issue_id: string;
  actor_id: string;
  type: string;
  payload: unknown;
  created_at: Date;
};

async function issueEventRowsForIssue(issueId: string): Promise<IssueEventRow[]> {
  const rows = await db.$client<IssueEventRow[]>`
    SELECT id, issue_id, actor_id, type, payload, created_at
    FROM "issue_event" WHERE issue_id = ${issueId}
  `;
  return rows
    .map((row) => ({ ...row, created_at: new Date(row.created_at) }))
    .sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
}

/** Backdate an Issue's latest 'status' event so its time-in-status becomes deterministic. */
async function backdateLatestStatusEvent(issueId: string, secondsAgo: number) {
  const backdatedTo = new Date(Date.now() - secondsAgo * 1000).toISOString();
  await db.$client`
    UPDATE "issue_event" SET created_at = ${backdatedTo}
    WHERE id = (
      SELECT id FROM "issue_event"
      WHERE issue_id = ${issueId} AND type = 'status'
      ORDER BY created_at DESC LIMIT 1
    )
  `;
}

async function teamRow(teamId: string) {
  const [row] = await db.$client<{ default_status_id: string | null; issue_counter: number }[]>`
    SELECT default_status_id, issue_counter FROM "team" WHERE id = ${teamId}
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

describe("Workspace-scoped Issue procedures", () => {
  it("issue.create defaults to the Team's default Status, priority none, and derives the identifier", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Default Status Team");

    const issue = await ownerApi.issue.create({ team: created.slug, title: "First issue" });

    expect(issue.identifier).toBe(`${created.key}-1`);
    expect(issue.title).toBe("First issue");
    expect(issue.priority).toBe(0);
    expect(issue.assigneeId).toBeNull();

    const teamAfter = await teamRow(created.id);
    expect(issue.statusId).toBe(teamAfter?.default_status_id);
  });

  it("issue.create accepts an explicit statusId belonging to the Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Explicit Status Team");
    const inProgress = getStatus(await statusRowsForTeam(created.id), "In Progress");

    const issue = await ownerApi.issue.create({
      team: created.slug,
      title: "Already in progress",
      statusId: inProgress.id,
    });

    expect(issue.statusId).toBe(inProgress.id);
  });

  it("issue.create rejects a statusId that belongs to a different Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const teamA = await createFixtureTeam(ownerApi, "Foreign Status Team A");
    const teamB = await createFixtureTeam(ownerApi, "Foreign Status Team B");
    const teamBTodo = getStatus(await statusRowsForTeam(teamB.id), "Todo");

    await expect(
      ownerApi.issue.create({ team: teamA.slug, title: "Wrong status", statusId: teamBTodo.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("issue.create allows a regular Workspace Member, not only Admin, per D13", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Member Create Team");
    const regularMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const memberApi = createWorkspaceApi(owner.workspaceId, regularMember.id);

    const issue = await memberApi.issue.create({ team: created.slug, title: "Filed by a Member" });

    expect(issue.identifier).toBe(`${created.key}-1`);
  });

  it("issue.update allows a regular Workspace Member to edit an Issue, per D13", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Member Update Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Editable" });
    const regularMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const memberApi = createWorkspaceApi(owner.workspaceId, regularMember.id);

    const updated = await memberApi.issue.update({ id: issue.id, title: "Edited by a Member" });

    expect(updated.title).toBe("Edited by a Member");
  });

  it("issue numbers increment atomically per Team under concurrent creates", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Concurrency Team");

    const concurrentCreates = 10;
    const issues = await Promise.all(
      Array.from({ length: concurrentCreates }, (_, index) =>
        ownerApi.issue.create({ team: created.slug, title: `Concurrent issue ${index}` }),
      ),
    );

    const numbers = issues.map((issue) => issue.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: concurrentCreates }, (_, i) => i + 1));
    const identifiers = new Set(issues.map((issue) => issue.identifier));
    expect(identifiers.size).toBe(concurrentCreates);

    const persisted = await issueRowsForTeam(created.id);
    expect(persisted).toHaveLength(concurrentCreates);
  });

  it("issue.list view=active returns only Unstarted and Started Issues", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Active View Team");
    const statuses = await statusRowsForTeam(created.id);
    const backlogIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "In backlog",
      statusId: getStatus(statuses, "Backlog").id,
    });
    const todoIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "Unstarted",
      statusId: getStatus(statuses, "Todo").id,
    });
    const inProgressIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "Started",
      statusId: getStatus(statuses, "In Progress").id,
    });

    const active = await ownerApi.issue.list({ team: created.slug, view: "active" });
    const activeIds = active.map((issue) => issue.id);

    expect(activeIds).toEqual(expect.arrayContaining([todoIssue.id, inProgressIssue.id]));
    expect(activeIds).not.toContain(backlogIssue.id);
  });

  it("issue.list view=backlog returns only Backlog Issues", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Backlog View Team");
    const statuses = await statusRowsForTeam(created.id);
    const backlogIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "In backlog",
      statusId: getStatus(statuses, "Backlog").id,
    });
    const todoIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "Unstarted",
      statusId: getStatus(statuses, "Todo").id,
    });

    const backlog = await ownerApi.issue.list({ team: created.slug, view: "backlog" });
    const backlogIds = backlog.map((issue) => issue.id);

    expect(backlogIds).toContain(backlogIssue.id);
    expect(backlogIds).not.toContain(todoIssue.id);
  });

  it("issue.list view=all returns every non-triage Status, including Completed and Canceled", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "All View Team");
    const statuses = await statusRowsForTeam(created.id);
    const doneIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "Done",
      statusId: getStatus(statuses, "Done").id,
    });
    const canceledIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "Canceled",
      statusId: getStatus(statuses, "Canceled").id,
    });

    const all = await ownerApi.issue.list({ team: created.slug, view: "all" });
    const allIds = all.map((issue) => issue.id);

    expect(allIds).toEqual(expect.arrayContaining([doneIssue.id, canceledIssue.id]));
  });

  it("issue.list returns NOT_FOUND for a Team outside the resolved Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Isolated List Team");

    await expect(api.issue.list({ team: created.slug, view: "all" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("issue.get resolves an Issue by its Team-key identifier", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Identifier Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Findable" });

    const found = await ownerApi.issue.get({ identifier: issue.identifier });

    expect(found.id).toBe(issue.id);
    expect(found.identifier).toBe(`${created.key}-1`);
  });

  it("issue.get returns NOT_FOUND for an unknown identifier", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Missing Identifier Team");

    await expect(ownerApi.issue.get({ identifier: `${created.key}-999` })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("issue.get hides a foreign Workspace's Issue even when the identifier matches", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Cross Workspace Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Not yours" });

    await expect(api.issue.get({ identifier: issue.identifier })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("issue.update edits title, description, priority, assignee and due date, recording an event per change", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Update Fields Team");
    const assignee = await createMemberInWorkspace(owner.workspaceId, "member");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Original title" });

    const updated = await ownerApi.issue.update({
      id: issue.id,
      title: "New title",
      description: "New description",
      priority: 2,
      assigneeId: assignee.id,
      dueDate: "2026-12-31",
    });

    expect(updated).toMatchObject({
      id: issue.id,
      title: "New title",
      description: "New description",
      priority: 2,
      assigneeId: assignee.id,
    });

    const events = await issueEventRowsForIssue(issue.id);
    const eventTypes = events.map((event) => event.type);
    expect(eventTypes).toContain("created");
    expect(eventTypes).toContain("title");
    expect(eventTypes).toContain("priority");
    expect(eventTypes).toContain("assignee");
    for (const event of events) {
      expect(event.actor_id).toBe(owner.memberId);
      expect(event.created_at).toBeInstanceOf(Date);
    }
  });

  it("issue.update into a Started Status sets startedAt; into Completed sets completedAt", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Timestamps Team");
    const statuses = await statusRowsForTeam(created.id);
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Track timestamps" });

    await ownerApi.issue.update({ id: issue.id, statusId: getStatus(statuses, "In Progress").id });
    const [afterStart] = await issueRowsForTeam(created.id);
    expect(afterStart?.started_at).not.toBeNull();
    expect(afterStart?.completed_at).toBeNull();

    await ownerApi.issue.update({ id: issue.id, statusId: getStatus(statuses, "Done").id });
    const [afterDone] = await issueRowsForTeam(created.id);
    expect(afterDone?.completed_at).not.toBeNull();
  });

  it("issue.update into a Canceled Status sets canceledAt", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Cancel Timestamp Team");
    const statuses = await statusRowsForTeam(created.id);
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Will be canceled" });

    await ownerApi.issue.update({ id: issue.id, statusId: getStatus(statuses, "Canceled").id });

    const [afterCancel] = await issueRowsForTeam(created.id);
    expect(afterCancel?.canceled_at).not.toBeNull();
  });

  it("issue.update rejects a statusId belonging to a different Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const teamA = await createFixtureTeam(ownerApi, "Update Foreign Status A");
    const teamB = await createFixtureTeam(ownerApi, "Update Foreign Status B");
    const issue = await ownerApi.issue.create({ team: teamA.slug, title: "Stays in A" });
    const teamBTodo = getStatus(await statusRowsForTeam(teamB.id), "Todo");

    await expect(
      ownerApi.issue.update({ id: issue.id, statusId: teamBTodo.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("issue.update returns NOT_FOUND for a foreign Workspace's Issue", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Update Isolation Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Not reachable" });

    await expect(api.issue.update({ id: issue.id, title: "Hijacked" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("issue.update with teamId moves the Issue, allocating a new number and mapping the Status by name", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const sourceTeam = await createFixtureTeam(ownerApi, "Move Source Team");
    const targetTeam = await createFixtureTeam(ownerApi, "Move Target Team");
    const sourceInProgress = getStatus(await statusRowsForTeam(sourceTeam.id), "In Progress");
    const targetInProgress = getStatus(await statusRowsForTeam(targetTeam.id), "In Progress");
    const issue = await ownerApi.issue.create({
      team: sourceTeam.slug,
      title: "Moving teams",
      statusId: sourceInProgress.id,
    });

    const moved = await ownerApi.issue.update({ id: issue.id, teamId: targetTeam.id });

    expect(moved.identifier).toBe(`${targetTeam.key}-1`);
    expect(moved.statusId).toBe(targetInProgress.id);

    const events = await issueEventRowsForIssue(issue.id);
    expect(events.length).toBeGreaterThan(1);
  });

  it("issue.update with teamId maps by Status category when no name matches in the target Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const sourceTeam = await createFixtureTeam(ownerApi, "Category Move Source");
    const targetTeam = await createFixtureTeam(ownerApi, "Category Move Target");
    const targetTodo = getStatus(await statusRowsForTeam(targetTeam.id), "Todo");
    const renamedTargetTodo = await ownerApi.status.update({
      id: targetTodo.id,
      name: "Doing",
    });
    const sourceTodo = getStatus(await statusRowsForTeam(sourceTeam.id), "Todo");
    const issue = await ownerApi.issue.create({
      team: sourceTeam.slug,
      title: "No name match on target",
      statusId: sourceTodo.id,
    });

    const moved = await ownerApi.issue.update({ id: issue.id, teamId: targetTeam.id });

    expect(moved.statusId).toBe(renamedTargetTodo.id);
  });

  it("issue.delete hard deletes the Issue and its events", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Delete Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Temporary" });

    await expect(ownerApi.issue.delete({ id: issue.id })).resolves.toBeUndefined();

    await expect(ownerApi.issue.get({ identifier: issue.identifier })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    const remainingEvents = await issueEventRowsForIssue(issue.id);
    expect(remainingEvents).toHaveLength(0);
  });

  it("issue.delete returns NOT_FOUND for a foreign Workspace's Issue", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Delete Isolation Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Untouchable" });

    await expect(api.issue.delete({ id: issue.id })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("issue.events returns type/payload/actorId/timestamps ordered from creation onward", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Events Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Has events" });
    await ownerApi.issue.update({ id: issue.id, priority: 1 });

    const events = await ownerApi.issue.events({ id: issue.id });

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0]).toMatchObject({ type: "created", actorId: owner.memberId });
    for (const event of events) {
      expect(typeof event.type).toBe("string");
      expect(event.actorId).toBe(owner.memberId);
      expect(new Date(event.createdAt).toString()).not.toBe("Invalid Date");
      expect("payload" in event).toBe(true);
    }
    const timestamps = events.map((event) => new Date(event.createdAt).getTime());
    expect(timestamps).toEqual([...timestamps].sort((a, b) => a - b));
  });

  it("status.delete requires moveIssuesTo when Issues reference the Status", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Status Delete Guard Team");
    const inReview = getStatus(await statusRowsForTeam(created.id), "In Review");
    await ownerApi.issue.create({
      team: created.slug,
      title: "Blocks the delete",
      statusId: inReview.id,
    });

    await expect(ownerApi.status.delete({ id: inReview.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("status.delete with moveIssuesTo reassigns the Status's Issues and records a Status Issue event for each", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Status Delete Move Team");
    const statuses = await statusRowsForTeam(created.id);
    const inReview = getStatus(statuses, "In Review");
    const inProgress = getStatus(statuses, "In Progress");
    const issueOne = await ownerApi.issue.create({
      team: created.slug,
      title: "Reassign me one",
      statusId: inReview.id,
    });
    const issueTwo = await ownerApi.issue.create({
      team: created.slug,
      title: "Reassign me two",
      statusId: inReview.id,
    });

    await expect(
      ownerApi.status.delete({ id: inReview.id, moveIssuesTo: inProgress.id }),
    ).resolves.toBeUndefined();

    const rows = await issueRowsForTeam(created.id);
    expect(rows.find((row) => row.id === issueOne.id)?.status_id).toBe(inProgress.id);
    expect(rows.find((row) => row.id === issueTwo.id)?.status_id).toBe(inProgress.id);

    const eventsOne = await issueEventRowsForIssue(issueOne.id);
    const eventsTwo = await issueEventRowsForIssue(issueTwo.id);
    expect(eventsOne.map((event) => event.type)).toContain("status");
    expect(eventsTwo.map((event) => event.type)).toContain("status");
  });

  it("team.list.issueCount reflects the real number of Issues in the Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Issue Count Team");

    await ownerApi.issue.create({ team: created.slug, title: "One" });
    await ownerApi.issue.create({ team: created.slug, title: "Two" });

    const listed = await ownerApi.team.list();
    const currentTeam = listed.find((row) => row.id === created.id);
    expect(currentTeam?.issueCount).toBe(2);
  });
});

/**
 * Stage 3.3: `issue.list` gains `filters`, `orderBy`, `orderDirection`, `groupBy` and
 * `subgroupBy`; `issue.reorder`, `issue.bulkUpdate`, `issue.bulkDelete` and `issue.facets`
 * are new.
 */
describe("Workspace-scoped Issue list filters, ordering, grouping and bulk actions (Stage 3.3)", () => {
  it("issue.list filters.statusIds narrows to the given Statuses", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter Status Team");
    const statuses = await statusRowsForTeam(created.id);
    const todo = getStatus(statuses, "Todo");
    const inProgress = getStatus(statuses, "In Progress");
    const todoIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "Todo issue",
      statusId: todo.id,
    });
    await ownerApi.issue.create({
      team: created.slug,
      title: "In progress issue",
      statusId: inProgress.id,
    });

    const filtered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { statusIds: [todo.id] },
    });

    expect(filtered.map((issue) => issue.id)).toEqual([todoIssue.id]);
  });

  it("issue.list filters.assigneeIds and filters.unassigned narrow by Assignee", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter Assignee Team");
    const assignee = await createMemberInWorkspace(owner.workspaceId, "member");
    const assigned = await ownerApi.issue.create({
      team: created.slug,
      title: "Assigned",
      assigneeId: assignee.id,
    });
    const unassigned = await ownerApi.issue.create({ team: created.slug, title: "Unassigned" });

    const byAssignee = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { assigneeIds: [assignee.id] },
    });
    expect(byAssignee.map((issue) => issue.id)).toEqual([assigned.id]);

    const onlyUnassigned = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { unassigned: true },
    });
    expect(onlyUnassigned.map((issue) => issue.id)).toEqual([unassigned.id]);
  });

  it("issue.list filters.creatorIds narrows by who filed the Issue", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter Creator Team");
    const otherMember = await createMemberInWorkspace(owner.workspaceId, "member");
    const otherApi = createWorkspaceApi(owner.workspaceId, otherMember.id);
    const ownerIssue = await ownerApi.issue.create({ team: created.slug, title: "By owner" });
    await otherApi.issue.create({ team: created.slug, title: "By other Member" });

    const byOwner = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { creatorIds: [owner.memberId] },
    });

    expect(byOwner.map((issue) => issue.id)).toEqual([ownerIssue.id]);
  });

  it("issue.list filters.priorities narrows by Priority", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter Priority Team");
    const urgent = await ownerApi.issue.create({
      team: created.slug,
      title: "Urgent",
      priority: 1,
    });
    await ownerApi.issue.create({ team: created.slug, title: "No priority", priority: 0 });

    const filtered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { priorities: [1] },
    });

    expect(filtered.map((issue) => issue.id)).toEqual([urgent.id]);
  });

  it("issue.list filters.dueDate range includes only Issues due within the window", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter Due Date Team");
    const dueInWindow = await ownerApi.issue.create({
      team: created.slug,
      title: "Due in window",
      dueDate: "2026-06-15",
    });
    await ownerApi.issue.create({
      team: created.slug,
      title: "Due outside window",
      dueDate: "2026-01-01",
    });
    await ownerApi.issue.create({ team: created.slug, title: "No due date" });

    const filtered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { dueDate: { from: "2026-06-01", to: "2026-06-30" } },
    });

    expect(filtered.map((issue) => issue.id)).toEqual([dueInWindow.id]);
  });

  it("issue.list filters.content matches title/description substrings", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter Content Team");
    const matching = await ownerApi.issue.create({
      team: created.slug,
      title: "Fix the login redirect",
    });
    await ownerApi.issue.create({ team: created.slug, title: "Unrelated issue" });

    const filtered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { content: "login redirect" },
    });

    expect(filtered.map((issue) => issue.id)).toEqual([matching.id]);
  });

  it("issue.list orderBy=title sorts alphabetically ascending by default", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Order Title Team");
    await ownerApi.issue.create({ team: created.slug, title: "Charlie" });
    await ownerApi.issue.create({ team: created.slug, title: "Alpha" });
    await ownerApi.issue.create({ team: created.slug, title: "Bravo" });

    const ordered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      orderBy: "title",
    });

    expect(ordered.map((issue) => issue.title)).toEqual(["Alpha", "Bravo", "Charlie"]);
  });

  it("issue.list orderBy=title with orderDirection=desc reverses the order", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Order Title Desc Team");
    await ownerApi.issue.create({ team: created.slug, title: "Charlie" });
    await ownerApi.issue.create({ team: created.slug, title: "Alpha" });
    await ownerApi.issue.create({ team: created.slug, title: "Bravo" });

    const ordered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      orderBy: "title",
      orderDirection: "desc",
    });

    expect(ordered.map((issue) => issue.title)).toEqual(["Charlie", "Bravo", "Alpha"]);
  });

  it("issue.list filters.createdAt range is inclusive of both bounds", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter CreatedAt Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Created now" });
    const createdAtIso = issue.createdAt;

    const inclusive = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { createdAt: { from: createdAtIso, to: createdAtIso } },
    });
    expect(inclusive.map((row) => row.id)).toEqual([issue.id]);

    const before = new Date(new Date(createdAtIso).getTime() - 60_000).toISOString();
    const excluding = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { createdAt: { from: before, to: before } },
    });
    expect(excluding.map((row) => row.id)).not.toContain(issue.id);
  });

  it("issue.list groupBy=status keeps Issues of the same Status contiguous", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Group Status Team");
    const statuses = await statusRowsForTeam(created.id);
    const todo = getStatus(statuses, "Todo");
    const inProgress = getStatus(statuses, "In Progress");
    await ownerApi.issue.create({ team: created.slug, title: "T1", statusId: todo.id });
    await ownerApi.issue.create({ team: created.slug, title: "P1", statusId: inProgress.id });
    await ownerApi.issue.create({ team: created.slug, title: "T2", statusId: todo.id });
    await ownerApi.issue.create({ team: created.slug, title: "P2", statusId: inProgress.id });

    const grouped = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      groupBy: "status",
    });

    // Every run of the same Status is unbroken: once a Status's block closes, it never reopens.
    const statusSequence = grouped.map((issue) => issue.statusId);
    const closedStatusIds = new Set<string>();
    let previousStatusId: string | null = null;
    for (const statusId of statusSequence) {
      if (statusId !== previousStatusId) {
        expect(closedStatusIds.has(statusId)).toBe(false);
        if (previousStatusId) closedStatusIds.add(previousStatusId);
        previousStatusId = statusId;
      }
    }
  });

  it("issue.reorder changes the manual position of an Issue within its Status", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Reorder Team");
    const statuses = await statusRowsForTeam(created.id);
    const todo = getStatus(statuses, "Todo");
    const first = await ownerApi.issue.create({
      team: created.slug,
      title: "First",
      statusId: todo.id,
    });
    const second = await ownerApi.issue.create({
      team: created.slug,
      title: "Second",
      statusId: todo.id,
    });
    const third = await ownerApi.issue.create({
      team: created.slug,
      title: "Third",
      statusId: todo.id,
    });

    // All three share the default sortOrder (0), so ties break by newest-first (Issue number
    // desc) before any reorder — the same tiebreak `issue.list`'s default ordering already uses.
    const beforeReorder = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { statusIds: [todo.id] },
      orderBy: "manual",
    });
    expect(beforeReorder.map((issue) => issue.id)).toEqual([third.id, second.id, first.id]);

    await expect(ownerApi.issue.reorder({ id: first.id, position: 0 })).resolves.toBeUndefined();

    const ordered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { statusIds: [todo.id] },
      orderBy: "manual",
    });
    expect(ordered.map((issue) => issue.id)).toEqual([first.id, third.id, second.id]);
  });

  it("issue.reorder returns NOT_FOUND for a foreign Workspace's Issue", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Reorder Isolation Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Unreachable" });

    await expect(api.issue.reorder({ id: issue.id, position: 0 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("issue.bulkUpdate applies a Status change to every Issue and returns updatedIds", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Bulk Update Team");
    const inProgress = getStatus(await statusRowsForTeam(created.id), "In Progress");
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "Bulk one" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Bulk two" });

    const result = await ownerApi.issue.bulkUpdate({
      ids: [issueOne.id, issueTwo.id],
      changes: { statusId: inProgress.id },
    });

    expect(new Set(result.updatedIds)).toEqual(new Set([issueOne.id, issueTwo.id]));
    expect(result.failed).toHaveLength(0);
    const rows = await issueRowsForTeam(created.id);
    expect(rows.every((row) => row.status_id === inProgress.id)).toBe(true);
  });

  it("issue.bulkUpdate isolates a per-Issue failure when the Status belongs to a different Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const teamA = await createFixtureTeam(ownerApi, "Bulk Cross Team A");
    const teamB = await createFixtureTeam(ownerApi, "Bulk Cross Team B");
    const teamBInProgress = getStatus(await statusRowsForTeam(teamB.id), "In Progress");
    const issueInA = await ownerApi.issue.create({ team: teamA.slug, title: "Stays in A" });
    const issueInB = await ownerApi.issue.create({ team: teamB.slug, title: "Belongs to B" });

    const result = await ownerApi.issue.bulkUpdate({
      ids: [issueInA.id, issueInB.id],
      changes: { statusId: teamBInProgress.id },
    });

    expect(result.updatedIds).toEqual([issueInB.id]);
    expect(result.failed).toEqual([
      expect.objectContaining({ id: issueInA.id, code: "BAD_REQUEST" }),
    ]);
  });

  it("issue.bulkUpdate isolates NOT_FOUND for an Issue outside the resolved Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Bulk Isolation Team");
    const reachable = await ownerApi.issue.create({ team: created.slug, title: "Reachable" });
    const foreignOwner = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreignOwner.workspaceId, foreignOwner.memberId);
    const foreignTeam = await createFixtureTeam(foreignApi, "Bulk Foreign Team");
    const unreachable = await foreignApi.issue.create({
      team: foreignTeam.slug,
      title: "Not yours",
    });

    const result = await ownerApi.issue.bulkUpdate({
      ids: [reachable.id, unreachable.id],
      changes: { priority: 1 },
    });

    expect(result.updatedIds).toEqual([reachable.id]);
    expect(result.failed).toEqual([
      expect.objectContaining({ id: unreachable.id, code: "NOT_FOUND" }),
    ]);
  });

  it("issue.bulkDelete hard deletes every reachable Issue and isolates NOT_FOUND for the rest", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Bulk Delete Team");
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "Delete one" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Delete two" });
    const foreignOwner = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreignOwner.workspaceId, foreignOwner.memberId);
    const foreignTeam = await createFixtureTeam(foreignApi, "Bulk Delete Foreign Team");
    const unreachable = await foreignApi.issue.create({
      team: foreignTeam.slug,
      title: "Not yours",
    });

    const result = await ownerApi.issue.bulkDelete({
      ids: [issueOne.id, issueTwo.id, unreachable.id],
    });

    expect(new Set(result.deletedIds)).toEqual(new Set([issueOne.id, issueTwo.id]));
    expect(result.failed).toEqual([
      expect.objectContaining({ id: unreachable.id, code: "NOT_FOUND" }),
    ]);
    const remaining = await issueRowsForTeam(created.id);
    expect(remaining).toHaveLength(0);
  });

  it("issue.facets counts Issues per Status, including Statuses with no Issues", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Facets Status Team");
    const statuses = await statusRowsForTeam(created.id);
    const todo = getStatus(statuses, "Todo");
    const inProgress = getStatus(statuses, "In Progress");
    await ownerApi.issue.create({ team: created.slug, title: "T1", statusId: todo.id });
    await ownerApi.issue.create({ team: created.slug, title: "T2", statusId: todo.id });
    await ownerApi.issue.create({ team: created.slug, title: "P1", statusId: inProgress.id });

    const facets = await ownerApi.issue.facets({ team: created.slug, view: "all" });

    const todoFacet = facets.status.find((row: { id: string }) => row.id === todo.id);
    const inProgressFacet = facets.status.find((row: { id: string }) => row.id === inProgress.id);
    const doneFacet = facets.status.find(
      (row: { id: string }) => row.id === getStatus(statuses, "Done").id,
    );
    expect(todoFacet?.count).toBe(2);
    expect(inProgressFacet?.count).toBe(1);
    // "Done" has no Issues but must still appear as a selectable, empty option.
    expect(doneFacet).toBeDefined();
    expect(doneFacet?.count).toBe(0);
  });

  it("issue.facets counts by Assignee (including unassigned) and by Priority", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Facets Assignee Priority Team");
    const assignee = await createMemberInWorkspace(owner.workspaceId, "member");
    await ownerApi.issue.create({
      team: created.slug,
      title: "Assigned urgent",
      assigneeId: assignee.id,
      priority: 1,
    });
    await ownerApi.issue.create({ team: created.slug, title: "Unassigned none", priority: 0 });

    const facets = await ownerApi.issue.facets({ team: created.slug, view: "all" });

    const assigneeFacet = facets.assignees.find(
      (row: { id: string | null }) => row.id === assignee.id,
    );
    const unassignedFacet = facets.assignees.find((row: { id: string | null }) => row.id === null);
    expect(assigneeFacet?.count).toBe(1);
    expect(unassignedFacet).toMatchObject({ id: null, name: null, count: 1 });
    const urgentFacet = facets.priority.find((row: { value: number }) => row.value === 1);
    const noneFacet = facets.priority.find((row: { value: number }) => row.value === 0);
    expect(urgentFacet?.count).toBe(1);
    expect(noneFacet?.count).toBe(1);
    // Priority 2 (High) has no Issues but must still appear as a selectable, empty option.
    const highFacet = facets.priority.find((row: { value: number }) => row.value === 2);
    expect(highFacet).toBeDefined();
    expect(highFacet?.count).toBe(0);
  });

  it("issue.facets returns NOT_FOUND for a Team outside the resolved Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Facets Isolation Team");

    await expect(api.issue.facets({ team: created.slug, view: "all" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("issue.list filters.timeInStatus narrows by seconds spent in the current Status, inclusive of both bounds", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Filter TimeInStatus Team");
    const statuses = await statusRowsForTeam(created.id);
    const inProgress = getStatus(statuses, "In Progress");

    // longLived's Status change happened ~100s ago; freshlyMoved's Status is brand new (~0s).
    const longLived = await ownerApi.issue.create({ team: created.slug, title: "Long lived" });
    await ownerApi.issue.update({ id: longLived.id, statusId: inProgress.id });
    await backdateLatestStatusEvent(longLived.id, 100);
    const freshlyMoved = await ownerApi.issue.create({
      team: created.slug,
      title: "Freshly moved",
      statusId: inProgress.id,
    });

    const aroundHundredSeconds = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { timeInStatus: { minSeconds: 90, maxSeconds: 110 } },
    });
    expect(aroundHundredSeconds.map((issue) => issue.id)).toEqual([longLived.id]);

    const nearZeroSeconds = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { timeInStatus: { maxSeconds: 10 } },
    });
    expect(nearZeroSeconds.map((issue) => issue.id)).toEqual([freshlyMoved.id]);
  });

  it("issue.list orderBy=timeInStatus sorts by duration in the current Status (desc default = longest first)", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Order TimeInStatus Team");
    const statuses = await statusRowsForTeam(created.id);
    const inProgress = getStatus(statuses, "In Progress");

    const longLived = await ownerApi.issue.create({ team: created.slug, title: "Long lived" });
    await ownerApi.issue.update({ id: longLived.id, statusId: inProgress.id });
    await backdateLatestStatusEvent(longLived.id, 24 * 60 * 60);
    const freshlyMoved = await ownerApi.issue.create({
      team: created.slug,
      title: "Freshly moved",
      statusId: inProgress.id,
    });

    const longestFirst = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { statusIds: [inProgress.id] },
      orderBy: "timeInStatus",
    });
    expect(longestFirst.map((issue) => issue.id)).toEqual([longLived.id, freshlyMoved.id]);

    const shortestFirst = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { statusIds: [inProgress.id] },
      orderBy: "timeInStatus",
      orderDirection: "asc",
    });
    expect(shortestFirst.map((issue) => issue.id)).toEqual([freshlyMoved.id, longLived.id]);
  });

  it("issue.reorder with groupBy=assignee reorders an Assignee's Issues across different Statuses", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Reorder By Assignee Team");
    const statuses = await statusRowsForTeam(created.id);
    const todo = getStatus(statuses, "Todo");
    const inProgress = getStatus(statuses, "In Progress");
    const assignee = await createMemberInWorkspace(owner.workspaceId, "member");
    const inTodo = await ownerApi.issue.create({
      team: created.slug,
      title: "Assignee's Todo Issue",
      statusId: todo.id,
      assigneeId: assignee.id,
    });
    const inProgressIssue = await ownerApi.issue.create({
      team: created.slug,
      title: "Assignee's In Progress Issue",
      statusId: inProgress.id,
      assigneeId: assignee.id,
    });

    await expect(
      ownerApi.issue.reorder({ id: inProgressIssue.id, position: 0, groupBy: "assignee" }),
    ).resolves.toBeUndefined();

    const grouped = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      groupBy: "assignee",
      orderBy: "manual",
    });
    const assigneeBlock = grouped.filter((issue) => issue.assigneeId === assignee.id);
    expect(assigneeBlock.map((issue) => issue.id)).toEqual([inProgressIssue.id, inTodo.id]);
  });

  it("concurrent issue.reorder calls within the same Status complete without deadlock or losing Issues", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Concurrent Reorder Team");
    const statuses = await statusRowsForTeam(created.id);
    const todo = getStatus(statuses, "Todo");
    const issues = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        ownerApi.issue.create({ team: created.slug, title: `Sibling ${index}`, statusId: todo.id }),
      ),
    );

    await expect(
      Promise.all(
        issues.map((issue, index) =>
          ownerApi.issue.reorder({ id: issue.id, position: (issues.length - 1 - index) % 5 }),
        ),
      ),
    ).resolves.toBeDefined();

    const ordered = await ownerApi.issue.list({
      team: created.slug,
      view: "all",
      filters: { statusIds: [todo.id] },
      orderBy: "manual",
    });
    expect(new Set(ordered.map((issue) => issue.id))).toEqual(
      new Set(issues.map((issue) => issue.id)),
    );
    expect(ordered).toHaveLength(issues.length);
  });
});

/**
 * Stage 3.4: `issue.create` accepts `parentId` (Team becomes optional, inferred from the
 * parent) and inherits Team/Priority from it, with conditional Assignee inheritance;
 * `issue.setParent({id, parentId | null})` is new, with cycle detection; every Issue exposes
 * `parentId` and `subIssueProgress: {completed, total}` counting all descendants; `issue.get`
 * also returns `parent: {id, identifier, title} | null`; deleting a parent detaches its
 * children (D4) instead of deleting them.
 */
describe("Workspace-scoped Issue Sub-issue procedures (Stage 3.4)", () => {
  it("issue.create with parentId infers the Team and inherits Priority from the parent", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Inherit Team");
    const parent = await ownerApi.issue.create({
      team: created.slug,
      title: "Parent",
      priority: 2,
    });

    const child = await ownerApi.issue.create({ parentId: parent.id, title: "Child" });

    expect(child.teamId).toBe(parent.teamId);
    expect(child.priority).toBe(2);
    expect(child.parentId).toBe(parent.id);
  });

  it("issue.create rejects a team that diverges from the parent's Team", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const teamA = await createFixtureTeam(ownerApi, "Sub-issue Team A");
    const teamB = await createFixtureTeam(ownerApi, "Sub-issue Team B");
    const parent = await ownerApi.issue.create({ team: teamA.slug, title: "Parent in A" });

    await expect(
      ownerApi.issue.create({ team: teamB.slug, parentId: parent.id, title: "Mismatched" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("issue.create with parentId lets an explicit Priority override the inherited one", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Priority Override");
    const parent = await ownerApi.issue.create({
      team: created.slug,
      title: "Parent",
      priority: 2,
    });

    const child = await ownerApi.issue.create({
      parentId: parent.id,
      title: "Child with its own priority",
      priority: 4,
    });

    expect(child.priority).toBe(4);
  });

  it("issue.create inherits the parent's Assignee when the actor is that Assignee", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Assignee Actor");
    const parent = await ownerApi.issue.create({
      team: created.slug,
      title: "Parent",
      assigneeId: owner.memberId,
    });

    const child = await ownerApi.issue.create({ parentId: parent.id, title: "Child" });

    expect(child.assigneeId).toBe(owner.memberId);
  });

  it("issue.create inherits the parent's Assignee when every existing sibling already has it", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Assignee Siblings");
    const parentAssignee = await createMemberInWorkspace(owner.workspaceId, "member");
    const parent = await ownerApi.issue.create({
      team: created.slug,
      title: "Parent",
      assigneeId: parentAssignee.id,
    });
    // First sibling already shares the parent's Assignee.
    await ownerApi.issue.create({
      parentId: parent.id,
      title: "First child",
      assigneeId: parentAssignee.id,
    });
    const otherActor = await createMemberInWorkspace(owner.workspaceId, "member");
    const otherActorApi = createWorkspaceApi(owner.workspaceId, otherActor.id);

    const secondChild = await otherActorApi.issue.create({
      parentId: parent.id,
      title: "Second child, actor is not the Assignee",
    });

    expect(secondChild.assigneeId).toBe(parentAssignee.id);
  });

  it("issue.create does not inherit the parent's Assignee when neither condition holds", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue No Assignee Inheritance");
    const parentAssignee = await createMemberInWorkspace(owner.workspaceId, "member");
    const parent = await ownerApi.issue.create({
      team: created.slug,
      title: "Parent",
      assigneeId: parentAssignee.id,
    });
    const differentAssignee = await createMemberInWorkspace(owner.workspaceId, "member");
    // Existing sibling has a different Assignee than the parent's, breaking the "all siblings
    // share it" condition.
    await ownerApi.issue.create({
      parentId: parent.id,
      title: "First child",
      assigneeId: differentAssignee.id,
    });
    const thirdActor = await createMemberInWorkspace(owner.workspaceId, "member");
    const thirdActorApi = createWorkspaceApi(owner.workspaceId, thirdActor.id);

    const secondChild = await thirdActorApi.issue.create({
      parentId: parent.id,
      title: "Second child",
    });

    expect(secondChild.assigneeId).toBeNull();
  });

  it("issue.setParent rejects a direct cycle", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Direct Cycle");
    const a = await ownerApi.issue.create({ team: created.slug, title: "A" });
    const b = await ownerApi.issue.create({ parentId: a.id, title: "B (child of A)" });

    await expect(ownerApi.issue.setParent({ id: a.id, parentId: b.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("issue.setParent rejects an Issue becoming its own parent", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Self Parent");
    const a = await ownerApi.issue.create({ team: created.slug, title: "A" });

    await expect(ownerApi.issue.setParent({ id: a.id, parentId: a.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("issue.setParent rejects an indirect cycle three levels deep", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Indirect Cycle");
    const a = await ownerApi.issue.create({ team: created.slug, title: "A" });
    const b = await ownerApi.issue.create({ parentId: a.id, title: "B (child of A)" });
    const c = await ownerApi.issue.create({ parentId: b.id, title: "C (child of B)" });

    await expect(ownerApi.issue.setParent({ id: a.id, parentId: c.id })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });

  it("issue.setParent rejects a parentId from a foreign Workspace", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Cross Workspace");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Mine" });
    const foreignOwner = await createWorkspaceAndMember();
    const foreignApi = createWorkspaceApi(foreignOwner.workspaceId, foreignOwner.memberId);
    const foreignTeam = await createFixtureTeam(foreignApi, "Sub-issue Foreign Team");
    const foreignIssue = await foreignApi.issue.create({
      team: foreignTeam.slug,
      title: "Not yours",
    });

    await expect(
      ownerApi.issue.setParent({ id: issue.id, parentId: foreignIssue.id }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("issue.setParent(null) removes the parent, turning a Sub-issue back into a plain Issue", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Remove Parent");
    const parent = await ownerApi.issue.create({ team: created.slug, title: "Parent" });
    const child = await ownerApi.issue.create({ parentId: parent.id, title: "Child" });

    await expect(ownerApi.issue.setParent({ id: child.id, parentId: null })).resolves.toBeDefined();

    const refetchedChild = await ownerApi.issue.get({ identifier: child.identifier });
    expect(refetchedChild.parentId).toBeNull();
    const refetchedParent = await ownerApi.issue.get({ identifier: parent.identifier });
    expect(refetchedParent.subIssueProgress).toEqual({ completed: 0, total: 0 });
  });

  it("subIssueProgress counts every descendant across three levels, and issue.get returns the parent summary", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Three Levels");
    const statuses = await statusRowsForTeam(created.id);
    const done = getStatus(statuses, "Done");

    const grandparent = await ownerApi.issue.create({ team: created.slug, title: "Grandparent" });
    const parentOne = await ownerApi.issue.create({
      parentId: grandparent.id,
      title: "Parent one",
    });
    const parentTwo = await ownerApi.issue.create({
      parentId: grandparent.id,
      title: "Parent two",
    });
    const childOneDone = await ownerApi.issue.create({
      parentId: parentOne.id,
      title: "Child one (done)",
      statusId: done.id,
    });
    await ownerApi.issue.create({ parentId: parentOne.id, title: "Child two (todo)" });
    await ownerApi.issue.create({
      parentId: parentTwo.id,
      title: "Child three (done)",
      statusId: done.id,
    });

    const refetchedGrandparent = await ownerApi.issue.get({ identifier: grandparent.identifier });
    expect(refetchedGrandparent.subIssueProgress).toEqual({ completed: 2, total: 5 });

    const refetchedParentOne = await ownerApi.issue.get({ identifier: parentOne.identifier });
    expect(refetchedParentOne.subIssueProgress).toEqual({ completed: 1, total: 2 });

    const refetchedParentTwo = await ownerApi.issue.get({ identifier: parentTwo.identifier });
    expect(refetchedParentTwo.subIssueProgress).toEqual({ completed: 1, total: 1 });

    const refetchedChild = await ownerApi.issue.get({ identifier: childOneDone.identifier });
    expect(refetchedChild.parent).toMatchObject({
      id: parentOne.id,
      identifier: parentOne.identifier,
      title: parentOne.title,
    });

    const refetchedGrandparentAgain = await ownerApi.issue.get({
      identifier: grandparent.identifier,
    });
    expect(refetchedGrandparentAgain.parent).toBeNull();
  });

  it("issue.list exposes parentId and subIssueProgress on every row", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue List Fields");
    const parent = await ownerApi.issue.create({ team: created.slug, title: "Parent" });
    const child = await ownerApi.issue.create({ parentId: parent.id, title: "Child" });

    const listed = await ownerApi.issue.list({ team: created.slug, view: "all" });
    const parentRow = listed.find((issue) => issue.id === parent.id);
    const childRow = listed.find((issue) => issue.id === child.id);

    expect(parentRow?.parentId).toBeNull();
    expect(parentRow?.subIssueProgress).toEqual({ completed: 0, total: 1 });
    expect(childRow?.parentId).toBe(parent.id);
    expect(childRow?.subIssueProgress).toEqual({ completed: 0, total: 0 });
  });

  it("issue.delete on a parent detaches its children instead of deleting them (D4)", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Sub-issue Delete Parent");
    const parent = await ownerApi.issue.create({ team: created.slug, title: "Parent" });
    const child = await ownerApi.issue.create({ parentId: parent.id, title: "Child" });

    await expect(ownerApi.issue.delete({ id: parent.id })).resolves.toBeUndefined();

    const refetchedChild = await ownerApi.issue.get({ identifier: child.identifier });
    expect(refetchedChild.parentId).toBeNull();
  });
});
