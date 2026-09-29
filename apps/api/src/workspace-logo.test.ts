import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import { afterAll, afterEach, describe, expect, it } from "vitest";
import { createDb, member, resolveWorkspaceMember, WORKSPACE_ID, workspace } from "@vyzer/db";
import { workspaceLogoUploadOutputSchema } from "@vyzer/contract";
import { createApp } from "./app";
import {
  MAX_WORKSPACE_LOGO_SIZE,
  type WorkspaceLogoObject,
  type WorkspaceLogoStorage,
} from "./workspace-logo";

function testDatabaseUrl(): string {
  const fromProcess = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (fromProcess) return fromProcess;

  try {
    const rootEnv = parseEnv(readFileSync(new URL("../../../.env", import.meta.url), "utf8"));
    if (rootEnv.DATABASE_URL) return rootEnv.DATABASE_URL;
  } catch {
    // CI and local runners can provide TEST_DATABASE_URL/DATABASE_URL directly.
  }

  throw new Error("Set TEST_DATABASE_URL or DATABASE_URL to run Workspace logo tests.");
}

const db = createDb(testDatabaseUrl());
const fixtureMemberIds: string[] = [];
const fixtureWorkspaceIds: string[] = [];
const tinyPng = new Uint8Array(
  Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j1ioAAAAASUVORK5CYII=",
    "base64",
  ),
);

function createMemoryLogoStorage() {
  const objects = new Map<string, WorkspaceLogoObject>();
  const writes: Array<{
    key: string;
    body: Uint8Array;
    contentType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";
  }> = [];
  const logoStorage: WorkspaceLogoStorage = {
    async put(input) {
      writes.push(input);
      objects.set(input.key, { body: input.body, contentType: input.contentType });
    },
    async get(key) {
      return objects.get(key) ?? null;
    },
  };

  return { logoStorage, writes };
}

function createLogoFile(data: Uint8Array, type = "image/png"): File {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(data);
  return new File([buffer], "workspace-logo", { type });
}

function createUploadRequest(file: File): RequestInit {
  const formData = new FormData();
  formData.set("file", file);
  return { method: "POST", body: formData };
}

async function createNonAdminMember() {
  const id = randomUUID();
  const suffix = randomUUID();
  await db.insert(member).values({
    id,
    workspaceId: WORKSPACE_ID,
    name: `Workspace Member ${suffix}`,
    email: `${suffix}@example.test`,
    role: "member",
  });
  fixtureMemberIds.push(id);
  return id;
}

async function createForeignWorkspaceAndMember() {
  const workspaceId = randomUUID();
  const memberId = randomUUID();
  const suffix = randomUUID();
  await db.insert(workspace).values({
    id: workspaceId,
    name: `Unrelated Workspace ${suffix}`,
    slug: `unrelated-${suffix}`,
    fiscalYearStartMonth: 1,
  });
  fixtureWorkspaceIds.push(workspaceId);
  await db.insert(member).values({
    id: memberId,
    workspaceId,
    name: `Unrelated Member ${suffix}`,
    email: `${suffix}@example.test`,
    role: "admin",
  });
  return { workspaceId, memberId };
}

afterEach(async () => {
  for (const memberId of fixtureMemberIds.splice(0)) {
    await db.$client`DELETE FROM "member" WHERE id = ${memberId}`;
  }
  for (const workspaceId of fixtureWorkspaceIds.splice(0)) {
    await db.$client`DELETE FROM "member" WHERE workspace_id = ${workspaceId}`;
    await db.$client`DELETE FROM "workspace" WHERE id = ${workspaceId}`;
  }
});

afterAll(async () => {
  await db.$client.end();
});

describe("Workspace logo API", () => {
  it("uploads a validated image and serves it from the returned same-origin URL", async () => {
    const { logoStorage, writes } = createMemoryLogoStorage();
    const app = createApp({ db, logoStorage });
    const response = await app.request(
      "/api/workspace/logo",
      createUploadRequest(createLogoFile(tinyPng)),
    );

    expect(response.status).toBe(201);
    const { logoUrl } = workspaceLogoUploadOutputSchema.parse(await response.json());
    expect(logoUrl).toMatch(/^\/api\/workspace\/logo\/[0-9a-f-]+\.png$/);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.key).toMatch(
      new RegExp(`^${WORKSPACE_ID}/workspace-logos/[0-9a-f-]+\\.png$`),
    );

    const imageResponse = await app.request(logoUrl);
    expect(imageResponse.status).toBe(200);
    expect(imageResponse.headers.get("content-type")).toBe("image/png");
    expect(imageResponse.headers.get("x-content-type-options")).toBe("nosniff");
    expect(new Uint8Array(await imageResponse.arrayBuffer())).toEqual(tinyPng);
  });

  it("rejects unsupported image types", async () => {
    const { logoStorage, writes } = createMemoryLogoStorage();
    const app = createApp({ db, logoStorage });
    const response = await app.request(
      "/api/workspace/logo",
      createUploadRequest(createLogoFile(new Uint8Array([0x47, 0x49, 0x46]), "image/gif")),
    );

    expect(response.status).toBe(415);
    expect(writes).toHaveLength(0);
  });

  it("rejects files larger than 5 MB", async () => {
    const { logoStorage, writes } = createMemoryLogoStorage();
    const app = createApp({ db, logoStorage });
    const oversized = new Uint8Array(MAX_WORKSPACE_LOGO_SIZE + 1);
    oversized.set(tinyPng);
    const response = await app.request(
      "/api/workspace/logo",
      createUploadRequest(createLogoFile(oversized)),
    );

    expect(response.status).toBe(413);
    expect(writes).toHaveLength(0);
  });

  it("rejects uploads from a non-admin Member", async () => {
    const memberId = await createNonAdminMember();
    const { logoStorage, writes } = createMemoryLogoStorage();
    const app = createApp({
      db,
      logoStorage,
      resolveWorkspaceContext: (contextDb) =>
        resolveWorkspaceMember(contextDb, WORKSPACE_ID, memberId),
    });
    const response = await app.request(
      "/api/workspace/logo",
      createUploadRequest(createLogoFile(tinyPng)),
    );

    expect(response.status).toBe(403);
    expect(writes).toHaveLength(0);
  });

  it("stores logo objects under the Workspace resolved for the request", async () => {
    const foreign = await createForeignWorkspaceAndMember();
    const [logoBefore] = await db.$client<{ logo_url: string | null }[]>`
      SELECT logo_url FROM "workspace" WHERE id = ${WORKSPACE_ID}
    `;
    const { logoStorage, writes } = createMemoryLogoStorage();
    const app = createApp({
      db,
      logoStorage,
      resolveWorkspaceContext: (contextDb) =>
        resolveWorkspaceMember(contextDb, foreign.workspaceId, foreign.memberId),
    });
    const response = await app.request(
      "/api/workspace/logo",
      createUploadRequest(createLogoFile(tinyPng)),
    );
    const [logoAfter] = await db.$client<{ logo_url: string | null }[]>`
      SELECT logo_url FROM "workspace" WHERE id = ${WORKSPACE_ID}
    `;

    expect(response.status).toBe(201);
    expect(writes).toHaveLength(1);
    expect(writes[0]?.key.startsWith(`${foreign.workspaceId}/workspace-logos/`)).toBe(true);
    expect(logoAfter?.logo_url).toBe(logoBefore?.logo_url);
  });
});
