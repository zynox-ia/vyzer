import { checkConnection } from "@vyzer/db";
import { base, workspaceScoped } from "./orpc";

export const router = base.router({
  health: base.health.handler(async ({ context }) => {
    await checkConnection(context.db);
    return { status: "ok" as const, database: "ok" as const };
  }),
  workspace: {
    current: workspaceScoped.workspace.current.handler(({ context }) => ({
      workspace: { id: context.workspace.id, name: context.workspace.name },
      member: {
        id: context.member.id,
        name: context.member.name,
        email: context.member.email,
        role: context.member.role,
      },
    })),
  },
});
