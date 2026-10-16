import type { Label, LabelListItem } from "@zynox/contract";
import { api } from "./api";

/** Lista Labels do Workspace e, quando informado, do Team selecionado. */
export const labelsQueryOptions = (team?: string) =>
  api.label.list.queryOptions({ input: team ? { team } : {} });

/** Cria um Label ou grupo em um dos escopos disponíveis. */
export const createLabelMutationOptions = () => api.label.create.mutationOptions();

/** Atualiza nome, descrição ou cor de um Label. */
export const updateLabelMutationOptions = () => api.label.update.mutationOptions();

/** Arquiva um Label, mantendo-o nas Issues já marcadas. */
export const archiveLabelMutationOptions = () => api.label.archive.mutationOptions();

/** Exclui um Label ou grupo e informa quantas Issues serão afetadas. */
export const deleteLabelMutationOptions = () => api.label.delete.mutationOptions();

/** Mescla o Label de origem no Label de destino. */
export const mergeLabelsMutationOptions = () => api.label.merge.mutationOptions();

/** Converte um Label em grupo e, opcionalmente, cria um filho. */
export const convertLabelToGroupMutationOptions = () => api.label.convertToGroup.mutationOptions();

/** Move um Label entre o Workspace e um Team. */
export const moveLabelMutationOptions = () => api.label.move.mutationOptions();

export type { Label, LabelListItem };
