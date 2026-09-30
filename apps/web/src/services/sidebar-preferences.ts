import { api } from "./api";

/** Preferências de sidebar do Member atual: badge, visibilidade e ordem dos nove itens. */
export const sidebarPreferencesQueryOptions = () => api.sidebarPreferences.get.queryOptions();

/** Grava badge, visibilidade ou ordem; quem chama atualiza o cache de sidebarPreferences. */
export const updateSidebarPreferencesMutationOptions = () =>
  api.sidebarPreferences.update.mutationOptions();
