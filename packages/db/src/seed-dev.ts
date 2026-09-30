import { and, asc, eq } from "drizzle-orm";
import { createDb, MEMBER_ID, notifyIssueEvent, WORKSPACE_ID, ZYNOX_TEAM_ID } from "./index";
import {
  issue,
  issueEvent,
  member,
  notification,
  team,
  teamMember,
  workflowStatus,
} from "./schema";

const DEV_MEMBER_ID = "00000000-0000-4000-8000-000000000005";
const DEV_ISSUE_ID = "00000000-0000-4000-8000-000000000006";
const ASSIGNMENT_EVENT_ID = "00000000-0000-4000-8000-000000000007";
const UNASSIGNMENT_EVENT_ID = "00000000-0000-4000-8000-000000000008";
const DEV_ISSUE_NUMBER = 900_000_000;

/** Seed a second Member and a pair of assignment examples outside the production seed. */
export async function seedDevInboxNotifications(db: ReturnType<typeof createDb>): Promise<void> {
  await db.transaction(async (tx) => {
    const [currentTeam] = await tx
      .select({ id: team.id })
      .from(team)
      .where(and(eq(team.id, ZYNOX_TEAM_ID), eq(team.workspaceId, WORKSPACE_ID)))
      .limit(1);
    const [defaultStatus] = await tx
      .select({ id: workflowStatus.id })
      .from(workflowStatus)
      .where(eq(workflowStatus.teamId, ZYNOX_TEAM_ID))
      .orderBy(asc(workflowStatus.position))
      .limit(1);

    if (!currentTeam || !defaultStatus) {
      throw new Error(
        "Run the database migrations and production seed before the development seed.",
      );
    }

    await tx
      .insert(member)
      .values({
        id: DEV_MEMBER_ID,
        workspaceId: WORKSPACE_ID,
        name: "Inbox Demo",
        email: "inbox-demo@example.test",
        role: "member",
      })
      .onConflictDoUpdate({
        target: member.id,
        set: {
          workspaceId: WORKSPACE_ID,
          name: "Inbox Demo",
          email: "inbox-demo@example.test",
          role: "member",
        },
      });

    await tx
      .insert(teamMember)
      .values({ teamId: ZYNOX_TEAM_ID, memberId: DEV_MEMBER_ID })
      .onConflictDoNothing();

    await tx
      .insert(issue)
      .values({
        id: DEV_ISSUE_ID,
        workspaceId: WORKSPACE_ID,
        teamId: ZYNOX_TEAM_ID,
        number: DEV_ISSUE_NUMBER,
        title: "Review the notification inbox",
        description: "Development seed issue for testing the Inbox screen.",
        statusId: defaultStatus.id,
        priority: 2,
        assigneeId: DEV_MEMBER_ID,
        creatorId: MEMBER_ID,
      })
      .onConflictDoNothing({ target: issue.id });

    const exampleIssueEvent = {
      workspaceId: WORKSPACE_ID,
      issueId: DEV_ISSUE_ID,
      actorId: DEV_MEMBER_ID,
      type: "assignee" as const,
    };
    const assignmentCreatedAt = new Date("2026-09-27T12:00:00.000Z");
    const unassignmentCreatedAt = new Date("2026-09-28T12:00:00.000Z");
    await tx
      .insert(issueEvent)
      .values({
        ...exampleIssueEvent,
        id: ASSIGNMENT_EVENT_ID,
        payload: { from: null, to: MEMBER_ID },
        createdAt: assignmentCreatedAt,
      })
      .onConflictDoNothing({ target: issueEvent.id });
    await tx
      .insert(issueEvent)
      .values({
        ...exampleIssueEvent,
        id: UNASSIGNMENT_EVENT_ID,
        payload: { from: MEMBER_ID, to: DEV_MEMBER_ID },
        createdAt: unassignmentCreatedAt,
      })
      .onConflictDoNothing({ target: issueEvent.id });

    const [assignmentEvent] = await tx
      .select()
      .from(issueEvent)
      .where(eq(issueEvent.id, ASSIGNMENT_EVENT_ID))
      .limit(1);
    const [unassignmentEvent] = await tx
      .select()
      .from(issueEvent)
      .where(eq(issueEvent.id, UNASSIGNMENT_EVENT_ID))
      .limit(1);
    if (!assignmentEvent || !unassignmentEvent) {
      throw new Error("Could not create the development IssueEvents.");
    }

    await notifyIssueEvent(tx, assignmentEvent);
    await notifyIssueEvent(tx, unassignmentEvent);

    await tx
      .update(notification)
      .set({ readAt: new Date(assignmentCreatedAt.getTime() + 1000) })
      .where(
        and(
          eq(notification.recipientId, MEMBER_ID),
          eq(notification.issueEventId, ASSIGNMENT_EVENT_ID),
        ),
      );
    await tx
      .update(notification)
      .set({ readAt: null })
      .where(
        and(
          eq(notification.recipientId, MEMBER_ID),
          eq(notification.issueEventId, UNASSIGNMENT_EVENT_ID),
        ),
      );
  });
}

const databaseUrl = process.env.DEV_DATABASE_URL;
if (!databaseUrl) {
  throw new Error("Set DEV_DATABASE_URL to the development database before running this seed.");
}

const db = createDb(databaseUrl);
try {
  await seedDevInboxNotifications(db);
} finally {
  await db.$client.end();
}
console.log("Development Inbox seed applied.");
