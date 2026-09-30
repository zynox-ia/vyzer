import type { ApiClient } from "@vyzer/contract";
import { api } from "./api";

/** Todas as preferências guardadas do Member atual (Preferences, spec preferences-persistence). */
export type MemberPreferences = Awaited<ReturnType<ApiClient["memberPreferences"]["get"]>>;

/** O que a tela edita: as preferências sem os ids. */
export type MemberPreferenceValues = Omit<MemberPreferences, "workspaceId" | "memberId">;

export const memberPreferencesQueryOptions = () => api.memberPreferences.get.queryOptions();

/** Grava um patch parcial; quem chama atualiza o cache de memberPreferences. */
export const updateMemberPreferencesMutationOptions = () =>
  api.memberPreferences.update.mutationOptions();
