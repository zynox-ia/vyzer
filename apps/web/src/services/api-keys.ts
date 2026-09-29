import { api } from "./api";

export type ApiKeyListScope = "mine" | "workspace";

/** API keys visible to the resolved Member or Workspace admin. */
export const apiKeysQueryOptions = (scope: ApiKeyListScope) =>
  api.apiKey.list.queryOptions({ input: { scope } });

/** Creates a personal API key and returns its one-time token. */
export const createApiKeyMutationOptions = () => api.apiKey.create.mutationOptions();

/** Revokes an API key within the current Workspace. */
export const revokeApiKeyMutationOptions = () => api.apiKey.revoke.mutationOptions();
