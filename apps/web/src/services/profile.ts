import type { ApiClient } from "@zynox/contract";
import { memberAvatarUploadOutputSchema } from "@zynox/contract";
import { api } from "./api";

/** Perfil do Member atual e se ele pode sair do Workspace (spec profile-settings). */
export type Profile = Awaited<ReturnType<ApiClient["profile"]["get"]>>;

export const profileQueryOptions = () => api.profile.get.queryOptions();

/** Grava só os campos enviados; quem chama atualiza o cache do perfil. */
export const updateProfileMutationOptions = () => api.profile.update.mutationOptions();

/** Remove o Member atual do Workspace. */
export const leaveWorkspaceMutationOptions = () => api.profile.leaveWorkspace.mutationOptions();

/** Envia a foto do Member; quem chama grava a URL devolvida. */
export const uploadMemberAvatarMutationOptions = () => ({
  mutationFn: async (file: File) => {
    const formData = new FormData();
    formData.set("file", file);

    const response = await fetch("/api/member/avatar", { method: "POST", body: formData });
    if (!response.ok) {
      throw new Error(
        response.status === 413
          ? "Photo must be 5 MB or smaller."
          : response.status === 415
            ? "Choose a PNG, JPG, WebP, or SVG image."
            : "Profile picture upload failed.",
      );
    }

    return memberAvatarUploadOutputSchema.parse(await response.json());
  },
});
