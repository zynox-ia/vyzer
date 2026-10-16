import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { bodyLimit } from "hono/body-limit";
import { Hono } from "hono";
import type { Db } from "@zynox/db";
import {
  memberAvatarUploadOutputSchema,
  memberAvatarUrlSchema,
  workspaceLogoUploadOutputSchema,
  workspaceLogoUrlSchema,
} from "@zynox/contract";
import { findWorkspaceMemberByAvatarUrl, updateWorkspaceMemberAvatar } from "@zynox/db";
import {
  createAuthenticatedWorkspaceContextResolver,
  requireAdminOnly,
  requireApiKeyPermission,
  resolveSeededWorkspaceContext,
  type WorkspaceContextResolver,
} from "./orpc";
import type { ZynoxAuth } from "./auth";
import { createRouter } from "./router";
import { createGithubHttpRouter } from "./github-http";
import type { GithubAppConfig, GithubFetch } from "./github-app";
import {
  memberAvatarObjectKey,
  memberAvatarUrl,
  MemberAvatarUploadError,
  readMemberAvatarUpload,
} from "./member-avatar";
import {
  MAX_WORKSPACE_LOGO_SIZE,
  readWorkspaceLogoUpload,
  workspaceLogoObjectKey,
  workspaceLogoUrl,
  WorkspaceLogoUploadError,
  type WorkspaceLogoStorage,
} from "./workspace-logo";

const RPC_PREFIX = "/api/rpc";
const LOGO_UPLOAD_PATH = "/api/workspace/logo";
const LOGO_BODY_LIMIT = MAX_WORKSPACE_LOGO_SIZE + 64 * 1024;
const AVATAR_UPLOAD_PATH = "/api/member/avatar";

type CreateAppOptions = {
  db: Db;
  logoStorage: WorkspaceLogoStorage;
  resolveWorkspaceContext?: WorkspaceContextResolver;
  auth?: ZynoxAuth;
  githubConfig?: GithubAppConfig | null;
  githubFetch?: GithubFetch;
};

export function createApp({
  db,
  logoStorage,
  resolveWorkspaceContext,
  auth,
  githubConfig = null,
  githubFetch,
}: CreateAppOptions) {
  const resolveContext =
    resolveWorkspaceContext ??
    (auth ? createAuthenticatedWorkspaceContextResolver(auth) : resolveSeededWorkspaceContext);
  const rpc = new RPCHandler(createRouter(resolveContext), {
    interceptors: [
      onError((error) => {
        if (error instanceof ORPCError && error.status < 500) return;
        console.error(error);
      }),
    ],
  });
  const app = new Hono();

  if (auth) {
    app.on(["GET", "POST"], "/api/auth/*", (context) => auth.handler(context.req.raw));
  }

  app.route(
    "/api/github",
    createGithubHttpRouter({
      db,
      config: githubConfig,
      resolveWorkspaceContext: resolveContext,
      fetcher: githubFetch,
    }),
  );

  app.use(`${RPC_PREFIX}/*`, async (c, next) => {
    const { matched, response } = await rpc.handle(c.req.raw, {
      prefix: RPC_PREFIX,
      context: { db, headers: c.req.raw.headers },
    });
    if (matched) return c.newResponse(response.body, response);
    await next();
  });

  app.post(
    LOGO_UPLOAD_PATH,
    bodyLimit({
      maxSize: LOGO_BODY_LIMIT,
      onError: (c) => c.json({ error: "Workspace logo exceeds 5 MB." }, 413),
    }),
    async (c) => {
      const context = await resolveContext(db, c.req.raw.headers);
      if (!context)
        return c.json({ error: "Workspace/Member context could not be resolved." }, 500);
      requireAdminOnly(context);

      if (!c.req.header("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
        return c.json({ error: "Upload one image in the file field." }, 400);
      }

      let formData: FormData;
      try {
        formData = await c.req.formData();
      } catch {
        return c.json({ error: "Invalid multipart upload." }, 400);
      }

      const files = formData.getAll("file");
      if (files.length !== 1 || !(files[0] instanceof File)) {
        return c.json({ error: "Upload one image in the file field." }, 400);
      }

      try {
        const upload = await readWorkspaceLogoUpload(files[0]);
        await logoStorage.put({
          key: workspaceLogoObjectKey(context.workspace.id, upload.fileName),
          body: upload.body,
          contentType: upload.contentType,
        });
        return c.json(
          workspaceLogoUploadOutputSchema.parse({ logoUrl: workspaceLogoUrl(upload.fileName) }),
          201,
        );
      } catch (error) {
        if (error instanceof WorkspaceLogoUploadError) {
          return c.json({ error: error.message }, error.status);
        }
        throw error;
      }
    },
  );

  app.get("/api/workspace/logo/:fileName", async (c) => {
    const context = await resolveContext(db, c.req.raw.headers);
    if (!context) return c.json({ error: "Workspace/Member context could not be resolved." }, 500);
    requireApiKeyPermission(context, "read");

    const fileName = c.req.param("fileName");
    if (!workspaceLogoUrlSchema.safeParse(workspaceLogoUrl(fileName)).success) {
      return c.notFound();
    }

    const object = await logoStorage.get(workspaceLogoObjectKey(context.workspace.id, fileName));
    if (!object) return c.notFound();

    return c.body(new Uint8Array(object.body), 200, {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Content-Type": object.contentType,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    });
  });

  app.post(
    AVATAR_UPLOAD_PATH,
    bodyLimit({
      maxSize: LOGO_BODY_LIMIT,
      onError: (c) => c.json({ error: "Member avatar exceeds 5 MB." }, 413),
    }),
    async (c) => {
      const context = await resolveContext(db, c.req.raw.headers);
      if (!context)
        return c.json({ error: "Workspace/Member context could not be resolved." }, 500);
      requireApiKeyPermission(context, "write");

      if (!c.req.header("content-type")?.toLowerCase().startsWith("multipart/form-data;")) {
        return c.json({ error: "Upload one image in the file field." }, 400);
      }

      let formData: FormData;
      try {
        formData = await c.req.formData();
      } catch {
        return c.json({ error: "Invalid multipart upload." }, 400);
      }

      const files = formData.getAll("file");
      if (files.length !== 1 || !(files[0] instanceof File)) {
        return c.json({ error: "Upload one image in the file field." }, 400);
      }

      try {
        const upload = await readMemberAvatarUpload(files[0]);
        const avatarUrl = memberAvatarUrl(upload.fileName);
        await logoStorage.put({
          key: memberAvatarObjectKey(context.workspace.id, context.member.id, upload.fileName),
          body: upload.body,
          contentType: upload.contentType,
        });
        const updatedMember = await updateWorkspaceMemberAvatar(
          db,
          context.workspace.id,
          context.member.id,
          avatarUrl,
        );
        if (!updatedMember) return c.notFound();

        return c.json(memberAvatarUploadOutputSchema.parse({ avatarUrl }), 201);
      } catch (error) {
        if (error instanceof MemberAvatarUploadError) {
          return c.json({ error: error.message }, error.status);
        }
        throw error;
      }
    },
  );

  app.get("/api/member/avatar/:fileName", async (c) => {
    const context = await resolveContext(db, c.req.raw.headers);
    if (!context) return c.json({ error: "Workspace/Member context could not be resolved." }, 500);
    requireApiKeyPermission(context, "read");

    const fileName = c.req.param("fileName");
    const avatarUrl = memberAvatarUrl(fileName);
    if (!memberAvatarUrlSchema.safeParse(avatarUrl).success) return c.notFound();

    const owner = await findWorkspaceMemberByAvatarUrl(db, context.workspace.id, avatarUrl);
    if (!owner) return c.notFound();

    const object = await logoStorage.get(
      memberAvatarObjectKey(context.workspace.id, owner.id, fileName),
    );
    if (!object) return c.notFound();

    return c.body(new Uint8Array(object.body), 200, {
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      "Content-Type": object.contentType,
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    });
  });

  app.onError((error, c) => {
    if (error instanceof ORPCError && error.code === "UNAUTHORIZED") {
      return c.json({ error: error.code }, 401);
    }
    if (error instanceof ORPCError && error.code === "FORBIDDEN") {
      return c.json({ error: error.code }, 403);
    }
    console.error(error);
    return c.json({ error: "Internal server error." }, 500);
  });

  return app;
}
