import type { IssueFacetsInput, IssueListInput } from "@zynox/contract";
import { api } from "./api";

/** Lista filtrada, ordenada e agrupada de Issues de um Team. */
export const issuesQueryOptions = (input: IssueListInput) => api.issue.list.queryOptions({ input });

/** Opções e contagens disponíveis para os filtros da lista de Issues. */
export const issueFacetsQueryOptions = (input: IssueFacetsInput) =>
  api.issue.facets.queryOptions({ input });

/** Uma Issue pelo identificador atual, por exemplo VYZ-35. */
export const issueQueryOptions = (identifier: string) =>
  api.issue.get.queryOptions({ input: { identifier } });

/** Activity persistida de uma Issue. */
export const issueEventsQueryOptions = (id: string) =>
  api.issue.events.queryOptions({ input: { id } });

/** Cria uma Issue no Team selecionado. */
export const createIssueMutationOptions = () => api.issue.create.mutationOptions();

/** Atualiza propriedades de uma Issue ou move-a para outro Team. */
export const updateIssueMutationOptions = () => api.issue.update.mutationOptions();

/** Define ou remove a Issue pai. */
export const setIssueParentMutationOptions = () => api.issue.setParent.mutationOptions();

/** Aplica ou remove Labels de uma Issue. */
export const setIssueLabelsMutationOptions = () => api.issue.setLabels.mutationOptions();

/** Exclui permanentemente uma Issue e seus eventos dependentes. */
export const deleteIssueMutationOptions = () => api.issue.delete.mutationOptions();

/** Reordena uma Issue manualmente dentro do Status atual. */
export const reorderIssueMutationOptions = () => api.issue.reorder.mutationOptions();

/** Atualiza várias Issues, mantendo os erros por Issue na resposta. */
export const bulkUpdateIssuesMutationOptions = () => api.issue.bulkUpdate.mutationOptions();

/** Exclui várias Issues, mantendo os erros por Issue na resposta. */
export const bulkDeleteIssuesMutationOptions = () => api.issue.bulkDelete.mutationOptions();
