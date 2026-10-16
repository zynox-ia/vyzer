/** Servidor da API (Hono + oRPC). Ver ADR-0004. */
import { serve } from "@hono/node-server";
import { db } from "./db";
import { env } from "./env";
import { createApp } from "./app";
import { createAuth } from "./auth";
import { loadGithubAppConfig } from "./github-app";
import { createAuthenticatedWorkspaceContextResolver, resolveSeededWorkspaceContext } from "./orpc";
import { createRustfsLogoStorage } from "./workspace-logo-storage";

const logoStorage = createRustfsLogoStorage({
  endpoint: env.rustfsEndpoint,
  bucket: env.rustfsBucket,
  accessKey: env.rustfsAccessKey,
  secretKey: env.rustfsSecretKey,
});
const githubConfig = await loadGithubAppConfig();
const auth = createAuth(db, { baseUrl: env.appBaseUrl, secret: env.authSecret });

// ADR-0015: sem tela de login ainda, requisições sem sessão usam o Workspace/Member fixo do seed.
// Em produção a sessão (ou API key) continua obrigatória.
const resolveSession = createAuthenticatedWorkspaceContextResolver(auth);
const app = createApp({
  db,
  logoStorage,
  githubConfig,
  auth,
  resolveWorkspaceContext: async (db, headers) =>
    (await resolveSession(db, headers)) ??
    (process.env.NODE_ENV === "production" ? null : resolveSeededWorkspaceContext(db, headers)),
});

const server = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: env.port }, (info) => {
  console.log(`API em http://127.0.0.1:${info.port}`);
});

function shutdown() {
  server.close(async () => {
    logoStorage.close?.();
    await db.$client.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
