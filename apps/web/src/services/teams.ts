import { api } from "./api";

/** Teams in the Workspace resolved by the API middleware (ADR-0015). */
export const teamsQueryOptions = () => api.team.list.queryOptions();

/** A Team selected by its stable slug within the current Workspace. */
export const teamQueryOptions = (slug: string) =>
  api.team.get.queryOptions({ input: { team: slug } });

/** Members linked to one Team in the current Workspace. */
export const teamMembersQueryOptions = (teamId: string) =>
  api.team.members.queryOptions({ input: { id: teamId } });

/** Creates a Team in the resolved Workspace. */
export const createTeamMutationOptions = () => api.team.create.mutationOptions();

/** Updates editable Team settings without changing the stable slug. */
export const updateTeamMutationOptions = () => api.team.update.mutationOptions();

/** Regenerates the Team's issue intake email address. */
export const resetTeamIssueEmailMutationOptions = () => api.team.resetIssueEmail.mutationOptions();

/** Permanently deletes a Team in the resolved Workspace. */
export const deleteTeamMutationOptions = () => api.team.delete.mutationOptions();
