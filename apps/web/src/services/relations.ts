import type {
  IssueLink,
  IssueRelationGroups,
  IssueRelationSummary,
  IssueRelationType,
} from "@zynox/contract";
import { api } from "./api";

/** Cria relações entre Issues, incluindo `blocks`, `related` e `duplicate`. */
export const addIssueRelationMutationOptions = () => api.relation.add.mutationOptions();

/** Remove uma relação entre Issues. */
export const removeIssueRelationMutationOptions = () => api.relation.remove.mutationOptions();

/** Anexa um link http(s) a uma Issue. */
export const addIssueLinkMutationOptions = () => api.link.add.mutationOptions();

/** Remove um link associado a uma Issue. */
export const removeIssueLinkMutationOptions = () => api.link.remove.mutationOptions();

export type { IssueLink, IssueRelationGroups, IssueRelationSummary, IssueRelationType };
