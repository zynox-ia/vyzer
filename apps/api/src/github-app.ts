import { createSign } from "node:crypto";

export type GithubAppConfig = {
  appId: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
  privateKey: string;
};

export type GithubFetch = typeof fetch;

const GITHUB_API_VERSION = "2026-03-10";

function required(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function loadGithubAppConfig(
  environment: NodeJS.ProcessEnv = process.env,
): Promise<GithubAppConfig | null> {
  const appId = required(environment.GITHUB_APP_ID);
  const clientId = required(environment.GITHUB_APP_CLIENT_ID);
  const clientSecret = required(environment.GITHUB_APP_CLIENT_SECRET);
  const webhookSecret = required(environment.GITHUB_APP_WEBHOOK_SECRET);
  const privateKeyPath = required(environment.GITHUB_APP_PRIVATE_KEY_PATH);
  if (!appId || !clientId || !clientSecret || !webhookSecret || !privateKeyPath) return null;

  const { readFile } = await import("node:fs/promises");
  const { isAbsolute, resolve } = await import("node:path");
  const { fileURLToPath } = await import("node:url");
  const workspaceRoot = fileURLToPath(new URL("../../../", import.meta.url));
  const absolutePath = isAbsolute(privateKeyPath)
    ? privateKeyPath
    : resolve(workspaceRoot, privateKeyPath);
  const privateKey = await readFile(absolutePath, "utf8");
  if (!privateKey.includes("BEGIN") || !privateKey.includes("PRIVATE KEY")) {
    throw new Error("GitHub App private key is invalid.");
  }

  return { appId, clientId, clientSecret, webhookSecret, privateKey };
}

export class GithubApiError extends Error {
  constructor(readonly status: number) {
    super("GitHub API request failed.");
  }
}

function base64UrlJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

export function createGithubAppJwt(config: GithubAppConfig, now = Date.now()): string {
  const currentSeconds = Math.floor(now / 1000);
  const header = base64UrlJson({ alg: "RS256", typ: "JWT" });
  const payload = base64UrlJson({
    iat: currentSeconds - 60,
    exp: currentSeconds + 9 * 60,
    iss: config.appId,
  });
  const signingInput = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(signingInput);
  signer.end();
  const signature = signer.sign(config.privateKey).toString("base64url");
  return `${signingInput}.${signature}`;
}

function githubApiHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
}

async function githubJson<T>(response: Response): Promise<T> {
  if (!response.ok) throw new GithubApiError(response.status);
  try {
    return (await response.json()) as T;
  } catch {
    throw new GithubApiError(response.status);
  }
}

export async function getGithubAppSlug(
  config: GithubAppConfig,
  fetcher: GithubFetch = fetch,
): Promise<string> {
  const response = await fetcher("https://api.github.com/app", {
    headers: githubApiHeaders(createGithubAppJwt(config)),
  });
  const app = await githubJson<{ slug?: unknown }>(response);
  if (typeof app.slug !== "string" || !/^[a-z0-9-]+$/i.test(app.slug)) {
    throw new GithubApiError(502);
  }
  return app.slug;
}

export async function exchangeGithubUserCode(
  config: GithubAppConfig,
  input: { code: string; redirectUri: string; codeVerifier?: string },
  fetcher: GithubFetch = fetch,
): Promise<string> {
  const response = await fetcher("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: input.code,
      redirect_uri: input.redirectUri,
      ...(input.codeVerifier ? { code_verifier: input.codeVerifier } : {}),
    }),
  });
  const result = await githubJson<{ access_token?: unknown; error?: unknown }>(response);
  if (typeof result.access_token !== "string" || result.access_token.length === 0) {
    throw new GithubApiError(401);
  }
  return result.access_token;
}

export type GithubUser = { id: string; login: string; avatarUrl: string | null };

export async function getGithubUser(
  userAccessToken: string,
  fetcher: GithubFetch = fetch,
): Promise<GithubUser> {
  const response = await fetcher("https://api.github.com/user", {
    headers: githubApiHeaders(userAccessToken),
  });
  const user = await githubJson<{ id?: unknown; login?: unknown; avatar_url?: unknown }>(response);
  if (
    (typeof user.id !== "number" && typeof user.id !== "string") ||
    typeof user.login !== "string" ||
    (user.avatar_url !== null && typeof user.avatar_url !== "string")
  ) {
    throw new GithubApiError(502);
  }
  return {
    id: String(user.id),
    login: user.login,
    avatarUrl: typeof user.avatar_url === "string" ? user.avatar_url : null,
  };
}

export type GithubUserInstallation = {
  installationId: string;
  accountId: string;
  accountLogin: string;
  accountType: string;
};

export async function verifyGithubUserInstallation(
  config: GithubAppConfig,
  userAccessToken: string,
  installationId: string,
  fetcher: GithubFetch = fetch,
): Promise<GithubUserInstallation> {
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const response = await fetcher(
      `https://api.github.com/user/installations?per_page=100&page=${page}`,
      {
        headers: githubApiHeaders(userAccessToken),
      },
    );
    const result = await githubJson<{
      total_count?: unknown;
      installations?: Array<{
        id?: unknown;
        app_id?: unknown;
        account?: { id?: unknown; login?: unknown; type?: unknown } | null;
      }>;
    }>(response);
    if (typeof result.total_count !== "number" || !Array.isArray(result.installations)) {
      throw new GithubApiError(502);
    }
    totalPages = Math.max(1, Math.ceil(result.total_count / 100));
    const found = result.installations.find(
      (installation) =>
        String(installation.id) === installationId && String(installation.app_id) === config.appId,
    );
    if (found) {
      if (
        (typeof found.account?.id !== "number" && typeof found.account?.id !== "string") ||
        typeof found.account.login !== "string" ||
        typeof found.account.type !== "string"
      ) {
        throw new GithubApiError(502);
      }
      return {
        installationId,
        accountId: String(found.account.id),
        accountLogin: found.account.login,
        accountType: found.account.type,
      };
    }
    page += 1;
  }

  throw new GithubApiError(403);
}

export async function createGithubInstallationAccessToken(
  config: GithubAppConfig,
  installationId: string,
  fetcher: GithubFetch = fetch,
): Promise<string> {
  const response = await fetcher(
    `https://api.github.com/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
    {
      method: "POST",
      headers: githubApiHeaders(createGithubAppJwt(config)),
    },
  );
  const result = await githubJson<{ token?: unknown }>(response);
  if (typeof result.token !== "string" || result.token.length === 0) {
    throw new GithubApiError(502);
  }
  return result.token;
}
