import {
  ImageUploadError,
  MAX_IMAGE_UPLOAD_SIZE,
  readImageUpload,
  type ImageMimeType,
  type ImageObject,
  type ImageUpload,
} from "./image-upload";

export const MAX_WORKSPACE_LOGO_SIZE = MAX_IMAGE_UPLOAD_SIZE;

export type WorkspaceLogoMimeType = ImageMimeType;
export type WorkspaceLogoObject = ImageObject;
export type WorkspaceLogoUpload = ImageUpload;

export interface WorkspaceLogoStorage {
  put(input: { key: string; body: Uint8Array; contentType: WorkspaceLogoMimeType }): Promise<void>;
  get(key: string): Promise<WorkspaceLogoObject | null>;
  close?(): void;
}

export class WorkspaceLogoUploadError extends ImageUploadError {}

export async function readWorkspaceLogoUpload(file: File): Promise<WorkspaceLogoUpload> {
  try {
    return await readImageUpload(file, "Workspace logo");
  } catch (error) {
    if (error instanceof ImageUploadError) {
      throw new WorkspaceLogoUploadError(error.status, error.message);
    }
    throw error;
  }
}

export function workspaceLogoObjectKey(workspaceId: string, fileName: string): string {
  return `${workspaceId}/workspace-logos/${fileName}`;
}

export function workspaceLogoUrl(fileName: string): string {
  return `/api/workspace/logo/${fileName}`;
}
