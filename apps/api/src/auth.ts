import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { schema, type Db } from "@zynox/db";

type CreateAuthOptions = {
  baseUrl: string;
  secret: string;
};

/**
 * Authentication owns credentials and sessions; Workspace membership remains
 * Zynox domain data. This deliberately avoids exposing the provider's generic
 * organization endpoints as a second source of truth for permissions.
 */
export function createAuth(db: Db, { baseUrl, secret }: CreateAuthOptions) {
  return betterAuth({
    baseURL: baseUrl,
    basePath: "/api/auth",
    secret,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: { enabled: true },
    user: { modelName: "authUser" },
    session: {
      modelName: "authSession",
      additionalFields: {
        activeWorkspaceId: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    account: { modelName: "authAccount" },
    verification: { modelName: "authVerification" },
  });
}

export type ZynoxAuth = ReturnType<typeof createAuth>;
