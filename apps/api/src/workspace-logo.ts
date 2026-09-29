import { randomUUID } from "node:crypto";

export const MAX_WORKSPACE_LOGO_SIZE = 5 * 1024 * 1024;

export type WorkspaceLogoMimeType = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

export type WorkspaceLogoObject = {
  body: Uint8Array;
  contentType: WorkspaceLogoMimeType;
};

export type WorkspaceLogoUpload = WorkspaceLogoObject & {
  fileName: string;
};

export interface WorkspaceLogoStorage {
  put(input: { key: string; body: Uint8Array; contentType: WorkspaceLogoMimeType }): Promise<void>;
  get(key: string): Promise<WorkspaceLogoObject | null>;
  close?(): void;
}

export class WorkspaceLogoUploadError extends Error {
  constructor(
    readonly status: 400 | 413 | 415,
    message: string,
  ) {
    super(message);
  }
}

const imageExtensions: Record<WorkspaceLogoMimeType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function hasBytes(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function matchesImageSignature(bytes: Uint8Array, contentType: WorkspaceLogoMimeType): boolean {
  switch (contentType) {
    case "image/png":
      return hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return hasBytes(bytes, [0xff, 0xd8, 0xff]);
    case "image/webp":
      return (
        hasBytes(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
      );
    case "image/svg+xml": {
      try {
        const svg = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        const root = svg
          .replace(/^\uFEFF/, "")
          .trimStart()
          .replace(/^(?:<\?xml[^?]*\?>\s*)?(?:<!--[\s\S]*?-->\s*)*/i, "");
        return !/<!DOCTYPE|<!ENTITY/i.test(svg) && /^<svg(?:\s|>)/i.test(root);
      } catch {
        return false;
      }
    }
  }
}

export async function readWorkspaceLogoUpload(file: File): Promise<WorkspaceLogoUpload> {
  if (file.size > MAX_WORKSPACE_LOGO_SIZE) {
    throw new WorkspaceLogoUploadError(413, "Workspace logo exceeds 5 MB.");
  }

  const contentType = file.type.toLowerCase() as WorkspaceLogoMimeType;
  if (!Object.hasOwn(imageExtensions, contentType)) {
    throw new WorkspaceLogoUploadError(415, "Workspace logo must be PNG, JPG, WebP, or SVG.");
  }

  const body = new Uint8Array(await file.arrayBuffer());
  if (body.length === 0 || body.length > MAX_WORKSPACE_LOGO_SIZE) {
    throw new WorkspaceLogoUploadError(
      body.length > MAX_WORKSPACE_LOGO_SIZE ? 413 : 400,
      body.length > MAX_WORKSPACE_LOGO_SIZE
        ? "Workspace logo exceeds 5 MB."
        : "Workspace logo file is empty.",
    );
  }

  if (!matchesImageSignature(body, contentType)) {
    throw new WorkspaceLogoUploadError(415, "Workspace logo contents do not match its image type.");
  }

  return {
    body,
    contentType,
    fileName: `${randomUUID()}.${imageExtensions[contentType]}`,
  };
}

export function workspaceLogoObjectKey(workspaceId: string, fileName: string): string {
  return `${workspaceId}/workspace-logos/${fileName}`;
}

export function workspaceLogoUrl(fileName: string): string {
  return `/api/workspace/logo/${fileName}`;
}
