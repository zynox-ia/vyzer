import { ORPCError } from "@orpc/server";
import {
  getWorkspaceMemberProfile,
  leaveWorkspaceAsMember,
  updateWorkspaceMemberProfile,
} from "@zynox/db";
import type { createWorkspaceMiddleware } from "./orpc";

type Middleware = ReturnType<typeof createWorkspaceMiddleware>;

function profileOutput(
  profile: NonNullable<Awaited<ReturnType<typeof getWorkspaceMemberProfile>>>,
) {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    title: profile.title,
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    canLeaveWorkspace: profile.canLeaveWorkspace,
  };
}

function isUniqueConstraintViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueConstraintViolation(error.cause);
}

export function createProfileRouter(middleware: Middleware) {
  return {
    profile: {
      get: middleware.workspaceScoped.profile.get.handler(async ({ context }) => {
        const profile = await getWorkspaceMemberProfile(
          context.db,
          context.workspace.id,
          context.member.id,
        );
        if (!profile) throw new ORPCError("NOT_FOUND");
        return profileOutput(profile);
      }),
      update: middleware.writeScoped.profile.update.handler(async ({ context, input }) => {
        let updated;
        try {
          updated = await updateWorkspaceMemberProfile(
            context.db,
            context.workspace.id,
            context.member.id,
            input,
          );
        } catch (error) {
          if (isUniqueConstraintViolation(error)) {
            throw new ORPCError("CONFLICT", { message: "This username is already in use." });
          }
          throw error;
        }
        if (!updated) throw new ORPCError("NOT_FOUND");

        const profile = await getWorkspaceMemberProfile(
          context.db,
          context.workspace.id,
          context.member.id,
        );
        if (!profile) throw new ORPCError("NOT_FOUND");
        return profileOutput(profile);
      }),
      leaveWorkspace: middleware.writeScoped.profile.leaveWorkspace.handler(async ({ context }) => {
        const result = await leaveWorkspaceAsMember(
          context.db,
          context.workspace.id,
          context.member.id,
        );
        if (result === "notFound") throw new ORPCError("NOT_FOUND");
        if (result === "lastMember") {
          throw new ORPCError("BAD_REQUEST", {
            message: "The last Member cannot leave the Workspace.",
          });
        }
        if (result === "lastAdmin") {
          throw new ORPCError("BAD_REQUEST", {
            message: "The last Workspace admin cannot leave.",
          });
        }
      }),
    },
  };
}
