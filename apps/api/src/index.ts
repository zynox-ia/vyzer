/** Servidor da API (Hono + oRPC). Ver ADR-0004. */
import { serve } from "@hono/node-server";
import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { Hono } from "hono";
import { db } from "./db";
import { env } from "./env";
import { router } from "./router";

/** Prefixo das chamadas oRPC. O Traefik (e o proxy do Vite) encaminham `/api` para cá. */
const RPC_PREFIX = "/api/rpc";

const rpc = new RPCHandler(router, {
  interceptors: [
    onError((error) => {
      // Erros de entrada (4xx) são esperados; só falhas do servidor vão para o log.
      if (error instanceof ORPCError && error.status < 500) return;
      console.error(error);
    }),
  ],
});

const app = new Hono();

app.use(`${RPC_PREFIX}/*`, async (c, next) => {
  const { matched, response } = await rpc.handle(c.req.raw, {
    prefix: RPC_PREFIX,
    context: { db, headers: c.req.raw.headers },
  });
  if (matched) return c.newResponse(response.body, response);
  await next();
});

const server = serve({ fetch: app.fetch, hostname: "127.0.0.1", port: env.port }, (info) => {
  console.log(`API em http://127.0.0.1:${info.port}`);
});

function shutdown() {
  server.close(async () => {
    await db.$client.end();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
