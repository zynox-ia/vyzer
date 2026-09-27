import { checkConnection } from "@vyzer/db";
import { base } from "./orpc";

export const router = base.router({
  health: base.health.handler(async ({ context }) => {
    await checkConnection(context.db);
    return { status: "ok" as const, database: "ok" as const };
  }),
});
