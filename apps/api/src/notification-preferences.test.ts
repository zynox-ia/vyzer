import { randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import { createDb, member, resolveWorkspaceMember, workspace } from "@zynox/db";
import { createRouter } from "./router";

function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error("Set TEST_DATABASE_URL to run Notification preference tests.");
  }
  return url;
}

const db = createDb(testDatabaseUrl());
const workspaceIds: string[] = [];

function createWorkspaceApi(workspaceId: string, memberId: string) {
  const scopedRouter = createRouter((contextDb) =>
    resolveWorkspaceMember(contextDb, workspaceId, memberId),
  );
  return createRouterClient(scopedRouter, { context: { db, headers: new Headers() } });
}

async function createWorkspaceAndMember() {
  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const suffix = randomUUID();

  await db.insert(workspace).values({
    id: workspaceId,
    name: `Notification preferences ${suffix}`,
    slug: `notification-preferences-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  workspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Notification member ${suffix}`,
    email: `${suffix}@example.test`,
    role: "member",
  });

  return { workspaceId, memberId, api: createWorkspaceApi(workspaceId, memberId) };
}

afterEach(async () => {
  for (const workspaceId of workspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("notificationPreferences", () => {
  it("creates defaults on read and applies partial updates", async () => {
    const { api } = await createWorkspaceAndMember();

    const defaults = await api.notificationPreferences.get();

    expect(defaults).toMatchObject({
      priorityInboxEnabled: false,
      emailEnabled: true,
      emailFormat: "digest",
      emailDigestDelayLowPriority: true,
      emailDigestUrgentImmediate: true,
      showChangelogInSidebar: true,
      changelogNewsletter: false,
      marketingAndOnboarding: true,
      inviteAccepted: true,
      privacyAndLegalUpdates: true,
      dataProcessingAgreement: false,
    });

    const updated = await api.notificationPreferences.update({
      priorityInboxEnabled: true,
      emailFormat: "immediate",
      dataProcessingAgreement: true,
    });

    expect(updated).toMatchObject({
      priorityInboxEnabled: true,
      emailFormat: "immediate",
      dataProcessingAgreement: true,
      emailEnabled: true,
      showChangelogInSidebar: true,
    });
    await expect(api.notificationPreferences.get()).resolves.toEqual(updated);
  });
});

describe("notificationTypePreferences", () => {
  it("returns the channel defaults and updates only the selected channel and types", async () => {
    const first = await createWorkspaceAndMember();
    const second = await createWorkspaceAndMember();

    const [priority, desktop, mobile, email, slack] = await Promise.all([
      first.api.notificationTypePreferences.get({ channel: "priority" }),
      first.api.notificationTypePreferences.get({ channel: "desktop" }),
      first.api.notificationTypePreferences.get({ channel: "mobile" }),
      first.api.notificationTypePreferences.get({ channel: "email" }),
      first.api.notificationTypePreferences.get({ channel: "slack" }),
    ]);
    const enabledTypes = (items: typeof priority.items) =>
      items.filter(({ enabled }) => enabled).map(({ type }) => type);

    expect(enabledTypes(priority.items)).toEqual(["assignments"]);
    expect(enabledTypes(desktop.items)).not.toContain("reactions");
    expect(desktop.items).toHaveLength(14);
    expect(desktop.items.filter(({ enabled }) => enabled)).toHaveLength(13);
    expect(enabledTypes(mobile.items)).toEqual(enabledTypes(desktop.items));
    expect(enabledTypes(email.items)).toHaveLength(14);
    expect(enabledTypes(slack.items)).toEqual([]);

    const updated = await first.api.notificationTypePreferences.update({
      channel: "priority",
      items: [
        { type: "assignments", enabled: false },
        { type: "status-changes", enabled: true },
      ],
    });

    expect(updated.items.find(({ type }) => type === "assignments")?.enabled).toBe(false);
    expect(updated.items.find(({ type }) => type === "status-changes")?.enabled).toBe(true);
    await expect(first.api.notificationTypePreferences.get({ channel: "email" })).resolves.toEqual(
      email,
    );
    await expect(
      second.api.notificationTypePreferences.get({ channel: "priority" }),
    ).resolves.toMatchObject({
      items: expect.arrayContaining([{ type: "assignments", enabled: true }]),
    });
  });
});
