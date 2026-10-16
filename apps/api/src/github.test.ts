import { createHmac, generateKeyPairSync, randomUUID } from "node:crypto";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createRouterClient } from "@orpc/server";
import {
  createDb,
  member,
  resolveWorkspaceMember,
  upsertWorkspaceGithubInstallation,
  workspace,
} from "@zynox/db";
import type { WorkspaceContextResolver } from "./orpc";
import { createApp } from "./app";
import type { GithubAppConfig, GithubFetch } from "./github-app";
import { verifyGithubWebhookSignature } from "./github-http";
import { createRouter } from "./router";
import type { WorkspaceLogoStorage } from "./workspace-logo";

function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Set TEST_DATABASE_URL to run GitHub integration tests.");
  return url;
}

const db = createDb(testDatabaseUrl());
const workspaceIds: string[] = [];
const generatedPrivateKey = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey.export({
  type: "pkcs8",
  format: "pem",
});
const fakeGithubConfig: GithubAppConfig = {
  appId: "123456",
  clientId: "Iv1.fake-client-id",
  clientSecret: "fake-github-client-secret-for-tests",
  webhookSecret: "fake-github-webhook-secret-for-tests",
  privateKey: generatedPrivateKey.toString(),
};

function createFakeGithubFetch(): GithubFetch {
  return async (input, _init) => {
    const url = new URL(typeof input === "string" ? input : input.toString());
    if (url.pathname === "/login/oauth/access_token") {
      return new Response(JSON.stringify({ access_token: "ghu_fake_test_token" }), { status: 200 });
    }
    if (url.pathname === "/app") {
      return new Response(JSON.stringify({ slug: "zynox-test-app" }), { status: 200 });
    }
    if (url.pathname === "/user") {
      return new Response(
        JSON.stringify({
          id: 7654321,
          login: "test-developer",
          avatar_url: "https://avatars.test/u/1",
        }),
        { status: 200 },
      );
    }
    if (url.pathname === "/user/installations") {
      return new Response(
        JSON.stringify({
          total_count: 1,
          installations: [
            {
              id: 9876543,
              app_id: 123456,
              account: { id: 456789, login: "sample-org", type: "Organization" },
            },
          ],
        }),
        { status: 200 },
      );
    }
    throw new Error(`Unexpected fake GitHub request: ${url.origin}${url.pathname}`);
  };
}

const logoStorage: WorkspaceLogoStorage = {
  async put() {},
  async get() {
    return null;
  },
};

async function createWorkspaceAndMember(role: "admin" | "member" = "admin") {
  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const suffix = randomUUID();
  await db.insert(workspace).values({
    id: workspaceId,
    name: `GitHub Workspace ${suffix}`,
    slug: `github-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  workspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `GitHub Member ${suffix}`,
    email: `${suffix}@example.test`,
    role,
  });

  const resolver: WorkspaceContextResolver = async (contextDb) =>
    resolveWorkspaceMember(contextDb, workspaceId, memberId);
  const api = createRouterClient(createRouter(resolver), {
    context: { db, headers: new Headers() },
  });
  const app = createApp({
    db,
    logoStorage,
    resolveWorkspaceContext: resolver,
    githubConfig: fakeGithubConfig,
    githubFetch: createFakeGithubFetch(),
  });

  return { workspaceId, memberId, api, app };
}

function signWebhook(body: string, secret = fakeGithubConfig.webhookSecret): string {
  return `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
}

function createPullRequestPayload(input: {
  installationId: string;
  repository: string;
  number: number;
  branch: string;
  updatedAt?: string;
}) {
  return {
    action: "opened",
    installation: { id: Number(input.installationId) },
    repository: { full_name: input.repository },
    pull_request: {
      number: input.number,
      title: "Link this pull request",
      html_url: `https://github.com/${input.repository}/pull/${input.number}`,
      state: "open",
      draft: false,
      merged: false,
      merged_at: null,
      updated_at: input.updatedAt ?? "2026-09-30T12:00:00Z",
      head: { ref: input.branch },
      user: { login: "github-author" },
      checks_status: "pending",
      review_decision: "review_required",
    },
  };
}

async function sendWebhook(
  app: ReturnType<typeof createApp>,
  payload: unknown,
  signature?: string,
) {
  const body = JSON.stringify(payload);
  return app.request("/api/github/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-GitHub-Event": "pull_request",
      "X-Hub-Signature-256": signature ?? signWebhook(body),
      "X-GitHub-Delivery": randomUUID(),
    },
    body,
  });
}

afterEach(async () => {
  for (const workspaceId of workspaceIds.splice(0)) {
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("GitHub webhook signature", () => {
  it("accepts valid HMAC signatures and rejects invalid or malformed signatures", () => {
    const body = Buffer.from('{"action":"opened"}');
    const signature = signWebhook(body.toString("utf8"));

    expect(verifyGithubWebhookSignature(body, signature, fakeGithubConfig.webhookSecret)).toBe(
      true,
    );
    expect(verifyGithubWebhookSignature(body, signature, "another-fake-secret")).toBe(false);
    expect(verifyGithubWebhookSignature(body, "sha256=bad", fakeGithubConfig.webhookSecret)).toBe(
      false,
    );
  });
});

describe("GitHub OAuth and installation", () => {
  it("starts a PKCE OAuth flow and persists identity without retaining the user token", async () => {
    const { api, app } = await createWorkspaceAndMember();
    const start = await app.request("/api/github/connect");
    expect(start.status).toBe(302);
    const authorizeUrl = new URL(start.headers.get("location") ?? "");
    expect(authorizeUrl.origin).toBe("https://github.com");
    expect(authorizeUrl.searchParams.get("code_challenge_method")).toBe("S256");
    const state = authorizeUrl.searchParams.get("state");
    const setCookie = start.headers.get("set-cookie");
    const cookie = setCookie?.split(";")[0];
    expect(state).toBeTruthy();
    expect(setCookie).toContain("HttpOnly");

    const callback = await app.request(
      `/api/github/callback?code=fake-oauth-code&state=${encodeURIComponent(state ?? "")}`,
      { headers: { Cookie: cookie?.split(";")[0] ?? "" } },
    );
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/settings/connected-accounts?github=connected");
    expect(callback.headers.get("set-cookie")).toContain("Max-Age=0");

    await expect(api.githubConnection.get()).resolves.toMatchObject({
      status: "connected",
      githubUserId: "7654321",
      login: "test-developer",
      avatarUrl: "https://avatars.test/u/1",
    });
    expect(JSON.stringify(await callback.text())).not.toContain("ghu_fake_test_token");

    await api.githubConnection.disconnect();
    await expect(api.githubConnection.get()).resolves.toEqual({ status: "disconnected" });
  });

  it("verifies the installing user's installation before associating it with the Workspace", async () => {
    const { api, memberId, workspaceId, app } = await createWorkspaceAndMember();
    const start = await app.request("/api/github/install");
    expect(start.status).toBe(302);
    const installUrl = new URL(start.headers.get("location") ?? "");
    expect(installUrl.pathname).toBe("/apps/zynox-test-app/installations/new");
    const state = installUrl.searchParams.get("state");
    const cookie = start.headers.get("set-cookie")?.split(";")[0];

    const callback = await app.request(
      `/api/github/callback?code=fake-install-oauth-code&state=${encodeURIComponent(state ?? "")}&installation_id=9876543&setup_action=install`,
      { headers: { Cookie: cookie ?? "" } },
    );
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/settings/connected-accounts?github=installed");

    const [installation] = await db.$client<
      Array<{
        workspace_id: string;
        installed_by_member_id: string;
        account_id: string;
        account_login: string;
        account_type: string;
        status: string;
      }>
    >`SELECT workspace_id, installed_by_member_id, account_id, account_login, account_type, status
      FROM "github_installation" WHERE installation_id = ${"9876543"}`;
    expect(installation).toMatchObject({
      workspace_id: workspaceId,
      installed_by_member_id: memberId,
      account_id: "456789",
      account_login: "sample-org",
      account_type: "Organization",
      status: "active",
    });
    await expect(api.githubConnection.get()).resolves.toMatchObject({ status: "connected" });
  });
});

describe("GitHub code review settings and pull request webhooks", () => {
  it("links matching branches idempotently, hides PRs when disabled, and relinks stored PRs when enabled", async () => {
    const { api, memberId, workspaceId, app } = await createWorkspaceAndMember();
    await expect(api.codeReviews.get()).resolves.toMatchObject({
      enabled: false,
      autoConvertDraftPullRequests: false,
      mergeStrategy: "merge",
    });
    const team = await api.team.create({
      name: `GitHub Team ${randomUUID().slice(0, 8)}`,
      key: `G${randomUUID().replaceAll("-", "").slice(0, 6).toUpperCase()}`,
      icon: { kind: "icon", name: "Layers", color: "purple" },
    });
    const issue = await api.issue.create({ team: team.slug, title: "Issue for PR" });
    await upsertWorkspaceGithubInstallation(db, workspaceId, {
      installationId: "3456789",
      accountId: "456789",
      accountLogin: "sample-org",
      accountType: "Organization",
      installedByMemberId: memberId,
    });

    const payload = createPullRequestPayload({
      installationId: "3456789",
      repository: "sample-org/repo",
      number: 42,
      branch: `feature/${team.key.toLowerCase()}-${issue.number}-handle-webhooks`,
    });
    const invalid = await sendWebhook(app, payload, "sha256=bad");
    expect(invalid.status).toBe(401);
    expect(await invalid.json()).toMatchObject({ error: "Invalid webhook signature." });

    const accepted = await sendWebhook(app, payload);
    const repeated = await sendWebhook(app, payload);
    expect(accepted.status).toBe(202);
    expect(repeated.status).toBe(202);
    expect(await api.issue.get({ identifier: issue.identifier })).toMatchObject({
      pullRequests: [],
    });

    const enabled = await api.codeReviews.update({ enabled: true });
    expect(enabled).toMatchObject({ enabled: true, mergeStrategy: "merge" });
    const linkedIssue = await api.issue.get({ identifier: issue.identifier });
    expect(linkedIssue.pullRequests).toHaveLength(1);
    expect(linkedIssue.pullRequests[0]).toMatchObject({
      number: 42,
      repoFullName: "sample-org/repo",
      authorLogin: "github-author",
      state: "open",
      checksStatus: "pending",
      reviewDecision: "review_required",
    });

    await api.codeReviews.update({ enabled: false });
    expect((await api.issue.get({ identifier: issue.identifier })).pullRequests).toEqual([]);
  });

  it("rejects a Member from changing Workspace-wide code review settings", async () => {
    const { api } = await createWorkspaceAndMember("member");
    await expect(api.codeReviews.update({ enabled: true })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
