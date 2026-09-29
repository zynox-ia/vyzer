import { api } from "./api";

/** Workspace and Member resolved by the API's fixed seed context (ADR-0015). */
export const currentWorkspaceQueryOptions = () => api.workspace.current.queryOptions();

/** Updates the current Workspace; callers invalidate currentWorkspaceQueryOptions after success. */
export const updateWorkspaceMutationOptions = () => api.workspace.update.mutationOptions();
