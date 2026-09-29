import { api } from "./api";
import { workspaceLogoUploadOutputSchema } from "@vyzer/contract";

/** Workspace and Member resolved by the API's fixed seed context (ADR-0015). */
export const currentWorkspaceQueryOptions = () => api.workspace.current.queryOptions();

/** Updates the current Workspace; callers invalidate currentWorkspaceQueryOptions after success. */
export const updateWorkspaceMutationOptions = () => api.workspace.update.mutationOptions();

/** Permanently deletes the current Workspace. */
export const deleteWorkspaceMutationOptions = () => api.workspace.delete.mutationOptions();

/** Uploads a Workspace logo to the API; callers can then save the returned URL. */
export const uploadWorkspaceLogoMutationOptions = () => ({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/workspace/logo", { method: "POST", body: formData });
    if (!response.ok) {
      throw new Error(
        response.status === 413
          ? "Logo must be 5 MB or smaller."
          : response.status === 415
            ? "Choose a PNG, JPG, WebP, or SVG image."
            : "Workspace logo upload failed.",
      );
    }

    return workspaceLogoUploadOutputSchema.parse(await response.json());
  },
});
