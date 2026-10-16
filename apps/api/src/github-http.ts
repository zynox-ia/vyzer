import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { Hono, type Context } from "hono";
import type { Db } from "@zynox/db";
import {
  findGithubInstallation,
  findWorkspaceIssueIdForGithubBranch,
  getOrCreateWorkspaceCodeReviewSettings,
  resolveWorkspaceMember,
  setWorkspaceGithubInstallationStatus,
  upsertWorkspaceGithubConnection,
  upsertWorkspaceGithubInstallation,
  upsertWorkspaceGithubPullRequest,
} from "@zynox/db";
import {
  exchangeGithubUserCode,
  getGithubAppSlug,
  getGithubUser,
  verifyGithubUserInstallation,
  type GithubAppConfig,
  type GithubFetch,
} from "./github-app";
import { requireAdminOnly, requireApiKeyPermission, type WorkspaceContextResolver } from "./orpc";

const OAUTH_COOKIE = "zynox_github_oauth";
const OAUTH_COOKIE_PATH = "/api/github/callback";
const OAUTH_TTL_MS = 10 * 60 * 1000;
const MAX_WEBHOOK_BODY_SIZE = 10 * 1024 * 1024;
const CONNECTED_ACCOUNTS_PATH = "/settings/connected-accounts";
const GITHUB_CALLBACK_PATH = "/api/github/callback";

type OAuthMode = "connect" | "install";

type OAuthState = {
  version: 1;
  mode: OAuthMode;
  state: string;
  workspaceId: string;
  memberId: string;
  createdAt: number;
  codeVerifier?: string;
};

type GithubHttpOptions = {
  db: Db;
  config: GithubAppConfig | null;
  resolveWorkspaceContext: WorkspaceContextResolver;
  fetcher?: GithubFetch;
};

function githubRedirectUri(requestUrl: string): string {
  return new URL(GITHUB_CALLBACK_PATH, requestUrl).toString();
}

function signedStateCookie(state: OAuthState, secret: string): string {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyStateCookie(cookie: string, secret: string): OAuthState | null {
  const [payload, signature, extra] = cookie.split(".");
  if (!payload || !signature || extra !== undefined) return null;
  const expectedSignature = createHmac("sha256", secret).update(payload).digest();
  let receivedSignature: Buffer;
  try {
    receivedSignature = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (
    receivedSignature.byteLength !== expectedSignature.byteLength ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<OAuthState>;
    if (
      decoded.version !== 1 ||
      (decoded.mode !== "connect" && decoded.mode !== "install") ||
      typeof decoded.state !== "string" ||
      typeof decoded.workspaceId !== "string" ||
      typeof decoded.memberId !== "string" ||
      typeof decoded.createdAt !== "number" ||
      (decoded.codeVerifier !== undefined && typeof decoded.codeVerifier !== "string")
    ) {
      return null;
    }
    return decoded as OAuthState;
  } catch {
    return null;
  }
}

function readOAuthCookie(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;
  for (const cookie of cookieHeader.split(";")) {
    const [name, ...value] = cookie.trim().split("=");
    if (name === OAUTH_COOKIE) return value.join("=") || null;
  }
  return null;
}

function setOAuthCookie(headers: Headers, cookie: string, requestUrl: string): void {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  headers.append(
    "Set-Cookie",
    `${OAUTH_COOKIE}=${cookie}; Path=${OAUTH_COOKIE_PATH}; Max-Age=${OAUTH_TTL_MS / 1000}; HttpOnly; SameSite=Lax${secure}`,
  );
}

function clearOAuthCookie(headers: Headers, requestUrl: string): void {
  const secure = new URL(requestUrl).protocol === "https:" ? "; Secure" : "";
  headers.append(
    "Set-Cookie",
    `${OAUTH_COOKIE}=; Path=${OAUTH_COOKIE_PATH}; Max-Age=0; HttpOnly; SameSite=Lax${secure}`,
  );
}

function constantTimeTextEqual(first: string, second: string): boolean {
  const a = Buffer.from(first);
  const b = Buffer.from(second);
  return a.byteLength === b.byteLength && timingSafeEqual(a, b);
}

function isRecent(state: OAuthState): boolean {
  const age = Date.now() - state.createdAt;
  return age >= 0 && age <= OAUTH_TTL_MS;
}

function validUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function redirectSettingsUrl(mode: "connected" | "installed" | "error"): string {
  const url = new URL(CONNECTED_ACCOUNTS_PATH, "http://zynox.invalid");
  url.searchParams.set("github", mode);
  return `${url.pathname}${url.search}`;
}

function cookieResponseHeaders(): Headers {
  const headers = new Headers({
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
  });
  return headers;
}

function parsePositiveId(value: unknown): string | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  const text = String(value);
  return /^\d+$/.test(text) && BigInt(text) > 0n ? text : null;
}

function parsePositiveInt(value: unknown): number | null {
  const text = parsePositiveId(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isSafeInteger(number) && number <= 2_147_483_647 ? number : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalEnum<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === "string" && allowed.includes(value as T) ? (value as T) : null;
}

function pullRequestState(
  value: Record<string, unknown>,
): "draft" | "open" | "merged" | "closed" | null {
  if (value.merged === true || (typeof value.merged_at === "string" && value.merged_at !== "")) {
    return "merged";
  }
  if (value.state === "closed") return "closed";
  if (value.state === "open") return value.draft === true ? "draft" : "open";
  return null;
}

async function readLimitedBody(request: Request, limit: number): Promise<Uint8Array | null> {
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let totalSize = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalSize += value.byteLength;
    if (totalSize > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(totalSize);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export function verifyGithubWebhookSignature(
  body: Uint8Array,
  signatureHeader: string | null,
  secret: string,
): boolean {
  if (!signatureHeader || !/^sha256=[0-9a-f]{64}$/i.test(signatureHeader)) return false;
  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(signatureHeader.slice("sha256=".length), "hex");
  return received.byteLength === expected.byteLength && timingSafeEqual(received, expected);
}

async function startOAuth(c: Context, options: GithubHttpOptions, mode: OAuthMode) {
  const { config } = options;
  if (!config) return c.json({ error: "GitHub integration is not configured." }, 503);

  try {
    const context = await options.resolveWorkspaceContext(options.db, c.req.raw.headers);
    if (!context) return c.json({ error: "Workspace/Member context could not be resolved." }, 500);
    if (mode === "install") requireAdminOnly(context);
    else requireApiKeyPermission(context, "read");

    const state = randomBytes(32).toString("base64url");
    const statePayload: OAuthState = {
      version: 1,
      mode,
      state,
      workspaceId: context.workspace.id,
      memberId: context.member.id,
      createdAt: Date.now(),
      ...(mode === "connect" ? { codeVerifier: randomBytes(48).toString("base64url") } : {}),
    };
    const headers = cookieResponseHeaders();
    setOAuthCookie(headers, signedStateCookie(statePayload, config.clientSecret), c.req.url);

    if (mode === "install") {
      const slug = await getGithubAppSlug(config, options.fetcher);
      const installUrl = new URL(
        `https://github.com/apps/${encodeURIComponent(slug)}/installations/new`,
      );
      installUrl.searchParams.set("state", state);
      headers.set("Location", installUrl.toString());
      return c.newResponse(null, { status: 302, headers });
    }

    const authorizeUrl = new URL("https://github.com/login/oauth/authorize");
    authorizeUrl.searchParams.set("client_id", config.clientId);
    authorizeUrl.searchParams.set("redirect_uri", githubRedirectUri(c.req.url));
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set(
      "code_challenge",
      createHash("sha256")
        .update(statePayload.codeVerifier ?? "")
        .digest("base64url"),
    );
    authorizeUrl.searchParams.set("code_challenge_method", "S256");
    headers.set("Location", authorizeUrl.toString());
    return c.newResponse(null, { status: 302, headers });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "FORBIDDEN") {
      return c.json({ error: "Forbidden." }, 403);
    }
    console.error("GitHub authorization start failed.");
    return c.json({ error: "Unable to start GitHub authorization." }, 500);
  }
}

async function completeOAuth(c: Context, options: GithubHttpOptions) {
  const { config } = options;
  const headers = cookieResponseHeaders();
  clearOAuthCookie(headers, c.req.url);
  if (!config) {
    headers.set("Location", redirectSettingsUrl("error"));
    return c.newResponse(null, { status: 302, headers });
  }

  const url = new URL(c.req.url);
  const oauthError = url.searchParams.get("error");
  const oauthCode = url.searchParams.get("code");
  const oauthState = url.searchParams.get("state");
  const cookieValue = readOAuthCookie(c.req.raw);
  const state = cookieValue ? verifyStateCookie(cookieValue, config.clientSecret) : null;
  if (
    oauthError ||
    !oauthCode ||
    !oauthState ||
    !state ||
    !isRecent(state) ||
    !constantTimeTextEqual(oauthState, state.state) ||
    !validUuid(state.workspaceId) ||
    !validUuid(state.memberId)
  ) {
    console.error("GitHub OAuth callback rejected.");
    headers.set("Location", redirectSettingsUrl("error"));
    return c.newResponse(null, { status: 302, headers });
  }

  const installationId = url.searchParams.get("installation_id");
  const setupAction = url.searchParams.get("setup_action");
  if (
    (state.mode === "install" && (!installationId || !parsePositiveId(installationId))) ||
    (state.mode === "connect" && installationId !== null)
  ) {
    console.error("GitHub OAuth callback rejected.");
    headers.set("Location", redirectSettingsUrl("error"));
    return c.newResponse(null, { status: 302, headers });
  }

  try {
    const context = await resolveWorkspaceMember(options.db, state.workspaceId, state.memberId);
    if (!context) throw new Error("Workspace member no longer exists.");

    const userAccessToken = await exchangeGithubUserCode(
      config,
      {
        code: oauthCode,
        redirectUri: githubRedirectUri(c.req.url),
        ...(state.mode === "connect" && state.codeVerifier
          ? { codeVerifier: state.codeVerifier }
          : {}),
      },
      options.fetcher,
    );
    const githubUser = await getGithubUser(userAccessToken, options.fetcher);
    const verifiedInstallation =
      state.mode === "install"
        ? await verifyGithubUserInstallation(
            config,
            userAccessToken,
            installationId as string,
            options.fetcher,
          )
        : null;

    if (verifiedInstallation) {
      if (setupAction !== "install" && setupAction !== "update") {
        throw new Error("The GitHub installation setup action is invalid.");
      }
      await upsertWorkspaceGithubInstallation(options.db, context.workspace.id, {
        ...verifiedInstallation,
        installedByMemberId: context.member.id,
      });
    }
    await upsertWorkspaceGithubConnection(options.db, context.workspace.id, context.member.id, {
      githubUserId: githubUser.id,
      githubLogin: githubUser.login,
      githubAvatarUrl: githubUser.avatarUrl,
    });

    headers.set("Location", redirectSettingsUrl(verifiedInstallation ? "installed" : "connected"));
    return c.newResponse(null, { status: 302, headers });
  } catch {
    console.error("GitHub OAuth callback failed.");
    headers.set("Location", redirectSettingsUrl("error"));
    return c.newResponse(null, { status: 302, headers });
  }
}

async function handleInstallationWebhook(db: Db, payload: Record<string, unknown>) {
  const installation = payload.installation;
  if (!isRecord(installation)) return false;
  const installationId = parsePositiveId(installation.id);
  if (!installationId || typeof payload.action !== "string") return false;
  const statusByAction: Record<string, "active" | "suspended" | "deleted"> = {
    created: "active",
    unsuspend: "active",
    new_permissions_accepted: "active",
    suspend: "suspended",
    deleted: "deleted",
  };
  const status = statusByAction[payload.action];
  if (!status) return true;
  await setWorkspaceGithubInstallationStatus(db, installationId, status);
  return true;
}

async function handlePullRequestWebhook(db: Db, payload: Record<string, unknown>) {
  const installation = payload.installation;
  const pullRequest = payload.pull_request;
  const repository = payload.repository;
  if (!isRecord(installation) || !isRecord(pullRequest) || !isRecord(repository)) return false;

  const externalInstallationId = parsePositiveId(installation.id);
  const number = parsePositiveInt(pullRequest.number);
  const head = pullRequest.head;
  const author = pullRequest.user;
  const installationRow = externalInstallationId
    ? await findGithubInstallation(db, externalInstallationId)
    : null;
  if (!installationRow || installationRow.status !== "active") return true;
  if (
    !number ||
    !isRecord(head) ||
    !isRecord(author) ||
    typeof head.ref !== "string" ||
    typeof author.login !== "string" ||
    typeof repository.full_name !== "string" ||
    typeof pullRequest.title !== "string" ||
    typeof pullRequest.html_url !== "string" ||
    typeof pullRequest.updated_at !== "string"
  ) {
    return false;
  }
  const updatedAt = new Date(pullRequest.updated_at);
  const state = pullRequestState(pullRequest);
  if (!Number.isFinite(updatedAt.getTime()) || !state) return false;

  const settings = await getOrCreateWorkspaceCodeReviewSettings(db, installationRow.workspaceId);
  const issueId =
    settings?.enabled === true
      ? await findWorkspaceIssueIdForGithubBranch(db, installationRow.workspaceId, head.ref)
      : null;
  await upsertWorkspaceGithubPullRequest(db, {
    workspaceId: installationRow.workspaceId,
    installationId: installationRow.id,
    issueId,
    repoFullName: repository.full_name,
    number,
    title: pullRequest.title,
    authorGithubLogin: author.login,
    url: pullRequest.html_url,
    state,
    headBranch: head.ref,
    checksStatus: optionalEnum(pullRequest.checks_status, ["pending", "success", "failure"]),
    reviewDecision: optionalEnum(pullRequest.review_decision, [
      "approved",
      "changes_requested",
      "review_required",
    ]),
    githubUpdatedAt: updatedAt,
  });
  return true;
}

async function completeWebhook(c: Context, options: GithubHttpOptions) {
  const { config } = options;
  if (!config) return c.json({ error: "GitHub integration is not configured." }, 503);
  const body = await readLimitedBody(c.req.raw, MAX_WEBHOOK_BODY_SIZE);
  if (!body) return c.json({ error: "Webhook payload is too large." }, 413);
  if (
    !verifyGithubWebhookSignature(
      body,
      c.req.header("x-hub-signature-256") ?? null,
      config.webhookSecret,
    )
  ) {
    return c.json({ error: "Invalid webhook signature." }, 401);
  }

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body).toString("utf8"));
  } catch {
    return c.json({ error: "Invalid webhook payload." }, 400);
  }
  if (!isRecord(payload)) return c.json({ error: "Invalid webhook payload." }, 400);

  try {
    const event = c.req.header("x-github-event");
    const valid =
      event === "installation"
        ? await handleInstallationWebhook(options.db, payload)
        : event === "pull_request"
          ? await handlePullRequestWebhook(options.db, payload)
          : true;
    if (!valid) return c.json({ error: "Invalid webhook payload." }, 400);
    return c.json({ received: true }, 202);
  } catch {
    console.error("GitHub webhook processing failed.");
    return c.json({ error: "Unable to process GitHub webhook." }, 500);
  }
}

export function createGithubHttpRouter(options: GithubHttpOptions) {
  const router = new Hono();
  router.get("/connect", (c) => startOAuth(c, options, "connect"));
  router.get("/install", (c) => startOAuth(c, options, "install"));
  router.get("/callback", (c) => completeOAuth(c, options));
  router.get("/webhook", (c) => c.json({ status: "ok" }, 200));
  router.post("/webhook", (c) => completeWebhook(c, options));
  return router;
}
