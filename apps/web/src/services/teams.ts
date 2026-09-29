import { api } from "./api";

/** Teams in the Workspace resolved by the API middleware (ADR-0015). */
export const teamsQueryOptions = () => api.team.list.queryOptions();

/** Creates a Team in the resolved Workspace. */
export const createTeamMutationOptions = () => api.team.create.mutationOptions();

/** Permanently deletes a Team in the resolved Workspace. */
export const deleteTeamMutationOptions = () => api.team.delete.mutationOptions();
