import { api } from "./api";

/** Issues de um Team para as views Active, Backlog ou All. */
export const issuesQueryOptions = (team: string, view?: "active" | "backlog" | "all") =>
  api.issue.list.queryOptions({ input: { team, view } });

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

/** Exclui permanentemente uma Issue e seus eventos dependentes. */
export const deleteIssueMutationOptions = () => api.issue.delete.mutationOptions();
