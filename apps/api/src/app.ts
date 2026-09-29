import { onError, ORPCError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { bodyLimit } from "hono/body-limit";
import { Hono } from "hono";
import type { Db } from "@vyzer/db";
import { workspaceLogoUploadOutputSchema, workspaceLogoUrlSchema } from "@vyzer/contract";
import { resolveSeededWorkspaceContext, type WorkspaceContextResolver } from "./orpc";
import { createRouter } from "./router";
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

type CreateAppOptions = {
  db: Db;
  logoStorage: WorkspaceLogoStorage;
  resolveWorkspaceContext?: WorkspaceContextResolver;
};

export function createApp({ db, logoStorage, resolveWorkspaceContext }: CreateAppOptions) {
  const resolveContext = resolveWorkspaceContext ?? resolveSeededWorkspaceContext;
  const rpc = new RPCHandler(createRouter(resolveContext), {
    interceptors: [
      onError((error) => {
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

  app.post(
    LOGO_UPLOAD_PATH,
    bodyLimit({
      maxSize: LOGO_BODY_LIMIT,
      onError: (c) => c.json({ error: "Workspace logo exceeds 5 MB." }, 413),
    }),
    async (c) => {
      const context = await resolveContext(db);
      if (!context)
        return c.json({ error: "Workspace/Member context could not be resolved." }, 500);
      if (context.member.role !== "admin") return c.json({ error: "Forbidden." }, 403);

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
    const context = await resolveContext(db);
    if (!context) return c.json({ error: "Workspace/Member context could not be resolved." }, 500);

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

  app.onError((error, c) => {
    console.error(error);
    return c.json({ error: "Internal server error." }, 500);
  });

  return app;
}
