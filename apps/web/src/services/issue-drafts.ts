import { api } from "./api";

/** Rascunhos de issue do Member atual (ainda não publicados). */
export const issueDraftsQueryOptions = () => api.issueDraft.list.queryOptions();

/** Salva um rascunho, inclusive vazio e sem Team. */
export const createIssueDraftMutationOptions = () => api.issueDraft.create.mutationOptions();

/** Atualiza título, descrição ou Team de um rascunho. */
export const updateIssueDraftMutationOptions = () => api.issueDraft.update.mutationOptions();

/** Publica o rascunho: vira uma Issue real no Team e sai da lista de rascunhos. */
export const publishIssueDraftMutationOptions = () => api.issueDraft.publish.mutationOptions();

/** Descarta o rascunho de vez. */
export const discardIssueDraftMutationOptions = () => api.issueDraft.discard.mutationOptions();
