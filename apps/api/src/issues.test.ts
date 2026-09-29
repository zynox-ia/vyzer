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
  started_at: Date | null;
  completed_at: Date | null;
  canceled_at: Date | null;
};

async function issueRowsForTeam(teamId: string): Promise<IssueRow[]> {
  const rows = await db.$client<IssueRow[]>`
    SELECT id, team_id, number, title, status_id, priority, assignee_id,
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
