import { api } from "./api";

/** Projects in the current Workspace, optionally scoped to a Team slug. */
export const projectsQueryOptions = (teamSlug?: string) =>
  api.project.list.queryOptions({ input: teamSlug === undefined ? {} : { teamSlug } });

/** One Project by id in the current Workspace. */
export const projectQueryOptions = (id: string) =>
  api.project.detail.queryOptions({ input: { id } });

/** Creates a Project and its Team links. */
export const createProjectMutationOptions = () => api.project.create.mutationOptions();

/** Updates a Project and optionally replaces its Team links. */
export const updateProjectMutationOptions = () => api.project.update.mutationOptions();

/** Permanently deletes a Project in the current Workspace. */
export const deleteProjectMutationOptions = () => api.project.delete.mutationOptions();
