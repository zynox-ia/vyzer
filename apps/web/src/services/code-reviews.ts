import type { ApiClient } from "@zynox/contract";
import { api } from "./api";

/** Configuração de Code & reviews da Workspace inteira (spec github-integration). */
export type CodeReviewSettings = Awaited<ReturnType<ApiClient["codeReviews"]["get"]>>;

export const codeReviewsQueryOptions = () => api.codeReviews.get.queryOptions();

/** Só Admin grava; quem chama atualiza o cache de codeReviews. */
export const updateCodeReviewsMutationOptions = () => api.codeReviews.update.mutationOptions();
