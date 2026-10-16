import { api } from "./api";

/**
 * Rascunhos de issue do Member atual (ainda não publicados). Missão 02 (navegação) tirou a
 * página /drafts da sidebar (fora do sitemap); salvar continua funcionando (Create new issue
 * fechado com texto ainda grava um rascunho), só sem tela para listar/retomar/publicar/descartar
 * — por isso `update`/`publish`/`discard` saíram deste arquivo (sem chamador no web; o endpoint
 * da API continua existindo).
 */
export const issueDraftsQueryOptions = () => api.issueDraft.list.queryOptions();

/** Salva um rascunho, inclusive vazio e sem Team. */
export const createIssueDraftMutationOptions = () => api.issueDraft.create.mutationOptions();
