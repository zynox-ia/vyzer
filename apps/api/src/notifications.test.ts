import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import {
  createDb,
  issueEvent,
  member,
  notifyIssueEvent,
  resolveWorkspaceMember,
  workspace,
} from "@vyzer/db";
import { createRouter } from "./router";

function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("Set TEST_DATABASE_URL (pointing at vyzer_teamd) to run Notification tests.");
  }
  return url;
}

const db = createDb(testDatabaseUrl());
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

/**
 * Insert a fixture 'assignee' IssueEvent directly (Time B has not wired `notifyIssueEvent`
 * into `issue.update` yet, per the Inbox spec) and run the notification fan-out over it,
 * exactly as the eventual production hook will.
 */
async function fixtureAssigneeEvent(params: {
  workspaceId: string;
  issueId: string;
  actorId: string;
  from?: string | null;
  to?: string | null;
  createdAt?: Date;
}) {
  const [event] = await db
    .insert(issueEvent)
    .values({
      workspaceId: params.workspaceId,
      issueId: params.issueId,
      actorId: params.actorId,
      type: "assignee",
      payload: { from: params.from ?? null, to: params.to ?? null },
      createdAt: params.createdAt,
    })
    .returning();
  if (!event) throw new Error("Failed to insert fixture IssueEvent.");

  await notifyIssueEvent(db, event);

  return event;
}

/** Insert a fixture IssueEvent of a non-'assignee' type, without running the fan-out. */
async function fixtureNonAssigneeEvent(params: {
  workspaceId: string;
  issueId: string;
  actorId: string;
}) {
  const [event] = await db
    .insert(issueEvent)
    .values({
      workspaceId: params.workspaceId,
      issueId: params.issueId,
      actorId: params.actorId,
      type: "priority",
      payload: { from: 0, to: 1 },
    })
    .returning();
  if (!event) throw new Error("Failed to insert fixture IssueEvent.");
  return event;
}

type NotificationRow = {
  id: string;
  recipient_id: string;
  type: string;
  actor_id: string | null;
  issue_id: string | null;
  issue_event_id: string | null;
  read_at: Date | null;
  archived_at: Date | null;
};

async function notificationRowsForEvent(issueEventId: string): Promise<NotificationRow[]> {
  return db.$client<NotificationRow[]>`
    SELECT id, recipient_id, type, actor_id, issue_id, issue_event_id, read_at, archived_at
    FROM "notification" WHERE issue_event_id = ${issueEventId}
  `;
}

afterEach(async () => {
  for (const workspaceId of foreignWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("notifyIssueEvent assignee fan-out", () => {
  it("creates an 'assigned' notification for the new Assignee when the actor differs from them", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Fan-out New Assignee Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Assign me" });
    const recipient = await createMemberInWorkspace(owner.workspaceId);

    const event = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      from: null,
      to: recipient.id,
    });

    const rows = await notificationRowsForEvent(event.id);
    expect(rows).toEqual([
      expect.objectContaining({
        recipient_id: recipient.id,
        type: "assigned",
        actor_id: owner.memberId,
        issue_id: issue.id,
      }),
    ]);
  });

  it("creates an 'unassigned' notification for the previous Assignee when reassigning to someone else", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Fan-out Reassign Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Reassign me" });
    const previousAssignee = await createMemberInWorkspace(owner.workspaceId);
    const newAssignee = await createMemberInWorkspace(owner.workspaceId);

    const event = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      from: previousAssignee.id,
      to: newAssignee.id,
    });

    const rows = await notificationRowsForEvent(event.id);
    expect(rows).toHaveLength(2);
    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ recipient_id: newAssignee.id, type: "assigned" }),
        expect.objectContaining({ recipient_id: previousAssignee.id, type: "unassigned" }),
      ]),
    );
  });

  it("excludes the actor when they assign the Issue to themselves", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Fan-out Self Assign Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Self assign" });

    const event = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      from: null,
      to: owner.memberId,
    });

    const rows = await notificationRowsForEvent(event.id);
    expect(rows).toHaveLength(0);
  });

  it("excludes the actor when they unassign themselves", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Fan-out Self Unassign Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Self unassign" });

    const event = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      from: owner.memberId,
      to: null,
    });

    const rows = await notificationRowsForEvent(event.id);
    expect(rows).toHaveLength(0);
  });

  it("notifies only the non-actor side when the actor reassigns away from themselves", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Fan-out Partial Actor Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Give it away" });
    const newAssignee = await createMemberInWorkspace(owner.workspaceId);

    const event = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      from: owner.memberId,
      to: newAssignee.id,
    });

    const rows = await notificationRowsForEvent(event.id);
    expect(rows).toEqual([
      expect.objectContaining({ recipient_id: newAssignee.id, type: "assigned" }),
    ]);
  });

  it("is idempotent: running the same IssueEvent through the fan-out twice does not duplicate notifications", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Fan-out Idempotence Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Notify once" });
    const recipient = await createMemberInWorkspace(owner.workspaceId);

    const event = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      from: null,
      to: recipient.id,
    });

    // Re-run the fan-out over the exact same IssueEvent, as a retried hook call would.
    await notifyIssueEvent(db, event);

    const rows = await notificationRowsForEvent(event.id);
    expect(rows).toHaveLength(1);
  });

  it("ignores IssueEvents that are not of type 'assignee'", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Fan-out Non Assignee Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Priority change" });

    const event = await fixtureNonAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
    });

    await expect(notifyIssueEvent(db, event)).resolves.toBeUndefined();
    const rows = await notificationRowsForEvent(event.id);
    expect(rows).toHaveLength(0);
  });

  it("skips a candidate id that is not a Member of the Workspace, without throwing", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Fan-out Unknown Candidate Team");
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Unknown assignee" });

    const event = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      from: null,
      to: randomUUID(),
    });

    const rows = await notificationRowsForEvent(event.id);
    expect(rows).toHaveLength(0);
  });
});

describe("notification.list and notification.unreadCount", () => {
  it("returns only the resolved Member's active notifications, newest first by default", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "List Order Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "Older" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Newer" });

    const older = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueOne.id,
      actorId: owner.memberId,
      to: recipient.id,
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
    });
    const newer = await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueTwo.id,
      actorId: owner.memberId,
      to: recipient.id,
      createdAt: new Date("2026-09-02T00:00:00.000Z"),
    });

    const list = await recipientApi.notification.list({ limit: 50 });

    expect(list.items.map((item) => item.issue?.id)).toEqual([issueTwo.id, issueOne.id]);
    expect(list.items[0]).toMatchObject({ type: "assigned", actor: { id: owner.memberId } });
    void older;
    void newer;
  });

  it("order=oldest reverses the default newest-first order", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "List Order Oldest Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "First" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Second" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueOne.id,
      actorId: owner.memberId,
      to: recipient.id,
      createdAt: new Date("2026-09-01T00:00:00.000Z"),
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueTwo.id,
      actorId: owner.memberId,
      to: recipient.id,
      createdAt: new Date("2026-09-02T00:00:00.000Z"),
    });

    const list = await recipientApi.notification.list({ order: "oldest", limit: 50 });

    expect(list.items.map((item) => item.issue?.id)).toEqual([issueOne.id, issueTwo.id]);
  });

  it("unreadOnly=true excludes notifications already marked as read", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "List Unread Only Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "Stays unread" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Gets read" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueOne.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueTwo.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    const all = await recipientApi.notification.list({ limit: 50 });
    const readNotification = all.items.find((item) => item.issue?.id === issueTwo.id);
    if (!readNotification) throw new Error("Fixture notification for issueTwo was not created.");
    await recipientApi.notification.markRead({ ids: [readNotification.id] });

    const unreadOnly = await recipientApi.notification.list({ unreadOnly: true, limit: 50 });

    expect(unreadOnly.items.map((item) => item.issue?.id)).toEqual([issueOne.id]);
  });

  it("unreadCount counts only active, unread notifications for the resolved Member", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Unread Count Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "One" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Two" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueOne.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueTwo.id,
      actorId: owner.memberId,
      to: recipient.id,
    });

    expect(await recipientApi.notification.unreadCount()).toBe(2);

    const list = await recipientApi.notification.list({ limit: 50 });
    const first = list.items[0];
    if (!first) throw new Error("Expected at least one fixture notification.");
    await recipientApi.notification.markRead({ ids: [first.id] });

    expect(await recipientApi.notification.unreadCount()).toBe(1);
  });

  it("isolates notifications per Member: one Member never sees another Member's notifications", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Member Isolation Team");
    const memberA = await createMemberInWorkspace(owner.workspaceId);
    const memberB = await createMemberInWorkspace(owner.workspaceId);
    const memberAApi = createWorkspaceApi(owner.workspaceId, memberA.id);
    const memberBApi = createWorkspaceApi(owner.workspaceId, memberB.id);
    const issueForA = await ownerApi.issue.create({ team: created.slug, title: "For A" });
    const issueForB = await ownerApi.issue.create({ team: created.slug, title: "For B" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueForA.id,
      actorId: owner.memberId,
      to: memberA.id,
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueForB.id,
      actorId: owner.memberId,
      to: memberB.id,
    });

    const listA = await memberAApi.notification.list({ limit: 50 });
    const listB = await memberBApi.notification.list({ limit: 50 });

    expect(listA.items.map((item) => item.issue?.id)).toEqual([issueForA.id]);
    expect(listB.items.map((item) => item.issue?.id)).toEqual([issueForB.id]);
  });

  it("isolates notifications per Workspace: a Member in a foreign Workspace never sees them", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Workspace Isolation Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const issue = await ownerApi.issue.create({
      team: created.slug,
      title: "Only in this Workspace",
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      to: recipient.id,
    });

    const foreignOwner = await createWorkspaceAndMember();
    const foreignOwnerApi = createWorkspaceApi(foreignOwner.workspaceId, foreignOwner.memberId);

    const foreignList = await foreignOwnerApi.notification.list({ limit: 50 });
    expect(foreignList.items).toHaveLength(0);
    expect(await foreignOwnerApi.notification.unreadCount()).toBe(0);
  });
});

describe("notification.markRead and notification.markUnread", () => {
  it("marks only the given ids as read for the resolved Member", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Mark Read Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "Mark this one" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Leave this one" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueOne.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueTwo.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    const before = await recipientApi.notification.list({ limit: 50 });
    const target = before.items.find((item) => item.issue?.id === issueOne.id);
    if (!target) throw new Error("Fixture notification for issueOne was not created.");

    await expect(recipientApi.notification.markRead({ ids: [target.id] })).resolves.toBeUndefined();

    const after = await recipientApi.notification.list({ limit: 50 });
    const markedItem = after.items.find((item) => item.id === target.id);
    const untouchedItem = after.items.find((item) => item.issue?.id === issueTwo.id);
    expect(markedItem?.readAt).not.toBeNull();
    expect(untouchedItem?.readAt).toBeNull();
  });

  it("markUnread reverts a notification's readAt back to null", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Mark Unread Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Toggle read state" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    const before = await recipientApi.notification.list({ limit: 50 });
    const target = before.items[0];
    if (!target) throw new Error("Expected a fixture notification.");
    await recipientApi.notification.markRead({ ids: [target.id] });

    await recipientApi.notification.markUnread({ ids: [target.id] });

    const after = await recipientApi.notification.list({ limit: 50 });
    expect(after.items.find((item) => item.id === target.id)?.readAt).toBeNull();
  });

  it("does not let one Member mark another Member's notification as read", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Mark Read Isolation Team");
    const memberA = await createMemberInWorkspace(owner.workspaceId);
    const memberB = await createMemberInWorkspace(owner.workspaceId);
    const memberAApi = createWorkspaceApi(owner.workspaceId, memberA.id);
    const memberBApi = createWorkspaceApi(owner.workspaceId, memberB.id);
    const issue = await ownerApi.issue.create({ team: created.slug, title: "Belongs to A" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issue.id,
      actorId: owner.memberId,
      to: memberA.id,
    });
    const listA = await memberAApi.notification.list({ limit: 50 });
    const notificationOfA = listA.items[0];
    if (!notificationOfA) throw new Error("Expected a fixture notification for Member A.");

    await expect(
      memberBApi.notification.markRead({ ids: [notificationOfA.id] }),
    ).resolves.toBeUndefined();

    const stillUnread = await memberAApi.notification.list({ limit: 50 });
    expect(stillUnread.items.find((item) => item.id === notificationOfA.id)?.readAt).toBeNull();
  });
});

describe("notification.archive and notification.archiveAll", () => {
  it("archive removes only the given notifications from subsequent active lists", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Archive Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "Archive this" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Keep this" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueOne.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueTwo.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    const before = await recipientApi.notification.list({ limit: 50 });
    const target = before.items.find((item) => item.issue?.id === issueOne.id);
    if (!target) throw new Error("Fixture notification for issueOne was not created.");

    await expect(recipientApi.notification.archive({ ids: [target.id] })).resolves.toBeUndefined();

    const after = await recipientApi.notification.list({ limit: 50 });
    expect(after.items.map((item) => item.issue?.id)).toEqual([issueTwo.id]);
  });

  it("archiveAll with onlyRead=true archives only already-read notifications", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Archive All Only Read Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const readIssue = await ownerApi.issue.create({ team: created.slug, title: "Was read" });
    const unreadIssue = await ownerApi.issue.create({ team: created.slug, title: "Still unread" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: readIssue.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: unreadIssue.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    const before = await recipientApi.notification.list({ limit: 50 });
    const readTarget = before.items.find((item) => item.issue?.id === readIssue.id);
    if (!readTarget) throw new Error("Fixture notification for readIssue was not created.");
    await recipientApi.notification.markRead({ ids: [readTarget.id] });

    await expect(recipientApi.notification.archiveAll({ onlyRead: true })).resolves.toBeUndefined();

    const after = await recipientApi.notification.list({ limit: 50 });
    expect(after.items.map((item) => item.issue?.id)).toEqual([unreadIssue.id]);
  });

  it("archiveAll without onlyRead (default) archives every active notification", async () => {
    const owner = await createWorkspaceAndMember();
    const ownerApi = createWorkspaceApi(owner.workspaceId, owner.memberId);
    const created = await createFixtureTeam(ownerApi, "Archive All Team");
    const recipient = await createMemberInWorkspace(owner.workspaceId);
    const recipientApi = createWorkspaceApi(owner.workspaceId, recipient.id);
    const issueOne = await ownerApi.issue.create({ team: created.slug, title: "One" });
    const issueTwo = await ownerApi.issue.create({ team: created.slug, title: "Two" });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueOne.id,
      actorId: owner.memberId,
      to: recipient.id,
    });
    await fixtureAssigneeEvent({
      workspaceId: owner.workspaceId,
      issueId: issueTwo.id,
      actorId: owner.memberId,
      to: recipient.id,
    });

    await expect(recipientApi.notification.archiveAll({})).resolves.toBeUndefined();

    const after = await recipientApi.notification.list({ limit: 50 });
    expect(after.items).toHaveLength(0);
    expect(await recipientApi.notification.unreadCount()).toBe(0);
  });
});
