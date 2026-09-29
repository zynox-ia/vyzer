/** Servidor da API (Hono + oRPC). Ver ADR-0004. */
import { serve } from "@hono/node-server";
import { db } from "./db";
import { env } from "./env";
import { createApp } from "./app";
import { createRustfsLogoStorage } from "./workspace-logo-storage";

const logoStorage = createRustfsLogoStorage({
  endpoint: env.rustfsEndpoint,
  bucket: env.rustfsBucket,
  accessKey: env.rustfsAccessKey,
  secretKey: env.rustfsSecretKey,
});
const app = createApp({ db, logoStorage });

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
