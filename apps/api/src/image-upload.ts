import { randomUUID } from "node:crypto";

export const MAX_IMAGE_UPLOAD_SIZE = 5 * 1024 * 1024;

export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml";

export type ImageObject = {
  body: Uint8Array;
  contentType: ImageMimeType;
};

export type ImageUpload = ImageObject & {
  fileName: string;
};

export class ImageUploadError extends Error {
  constructor(
    readonly status: 400 | 413 | 415,
    message: string,
  ) {
    super(message);
  }
}

const imageExtensions: Record<ImageMimeType, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

function hasBytes(bytes: Uint8Array, signature: number[]): boolean {
  return signature.every((byte, index) => bytes[index] === byte);
}

function matchesImageSignature(bytes: Uint8Array, contentType: ImageMimeType): boolean {
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

export async function readImageUpload(file: File, label: string): Promise<ImageUpload> {
  if (file.size > MAX_IMAGE_UPLOAD_SIZE) {
    throw new ImageUploadError(413, `${label} exceeds 5 MB.`);
  }

  const contentType = file.type.toLowerCase() as ImageMimeType;
  if (!Object.hasOwn(imageExtensions, contentType)) {
    throw new ImageUploadError(415, `${label} must be PNG, JPG, WebP, or SVG.`);
  }

  const body = new Uint8Array(await file.arrayBuffer());
  if (body.length === 0 || body.length > MAX_IMAGE_UPLOAD_SIZE) {
    throw new ImageUploadError(
      body.length > MAX_IMAGE_UPLOAD_SIZE ? 413 : 400,
      body.length > MAX_IMAGE_UPLOAD_SIZE ? `${label} exceeds 5 MB.` : `${label} file is empty.`,
    );
  }

  if (!matchesImageSignature(body, contentType)) {
    throw new ImageUploadError(415, `${label} contents do not match its image type.`);
  }

  return {
    body,
    contentType,
    fileName: `${randomUUID()}.${imageExtensions[contentType]}`,
  };
}
