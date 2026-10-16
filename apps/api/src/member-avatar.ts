import {
  ImageUploadError,
  readImageUpload,
  type ImageMimeType,
  type ImageObject,
  type ImageUpload,
} from "./image-upload";

export type MemberAvatarMimeType = ImageMimeType;
export type MemberAvatarObject = ImageObject;
export type MemberAvatarUpload = ImageUpload;

export class MemberAvatarUploadError extends ImageUploadError {}

export async function readMemberAvatarUpload(file: File): Promise<MemberAvatarUpload> {
  try {
    return await readImageUpload(file, "Member avatar");
  } catch (error) {
    if (error instanceof ImageUploadError) {
      throw new MemberAvatarUploadError(error.status, error.message);
    }
    throw error;
  }
}

export function memberAvatarObjectKey(
  workspaceId: string,
  memberId: string,
  fileName: string,
): string {
  return `${workspaceId}/members/${memberId}/avatars/${fileName}`;
}

export function memberAvatarUrl(fileName: string): string {
  return `/api/member/avatar/${fileName}`;
}
