import { api } from "./api";

/** Statuses do Workflow de um Team, ordenados por categoria e posição. */
export const statusesQueryOptions = (team: string) =>
  api.status.list.queryOptions({ input: { team } });

/** Cria um Status no Workflow de um Team. */
export const createStatusMutationOptions = () => api.status.create.mutationOptions();

/** Atualiza nome, descrição ou cor de um Status. */
export const updateStatusMutationOptions = () => api.status.update.mutationOptions();

/** Exclui um Status do Workflow do Team. */
export const deleteStatusMutationOptions = () => api.status.delete.mutationOptions();

/** Reordena um Status dentro da categoria atual. */
export const reorderStatusMutationOptions = () => api.status.reorder.mutationOptions();

/** Define o Status padrão do Team. */
export const setDefaultStatusMutationOptions = () => api.status.setDefault.mutationOptions();
