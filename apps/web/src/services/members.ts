import { api } from "./api";

/** Members of the Workspace resolved by the API middleware (ADR-0015). */
export const membersQueryOptions = () => api.member.list.queryOptions();

/** Renames one Member in the current Workspace. */
export const updateMemberMutationOptions = () => api.member.update.mutationOptions();
