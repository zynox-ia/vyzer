import { api } from "./api";

type CustomerDomainRuleKind = "excluded" | "generic";

/** Customer request settings for the Workspace resolved by the API middleware. */
export const customerSettingsQueryOptions = () => api.customerSettings.get.queryOptions();

/** Updates customer request settings in the current Workspace. */
export const updateCustomerSettingsMutationOptions = () =>
  api.customerSettings.update.mutationOptions();

/** Lists the custom domain rules of one kind for the current Workspace. */
export const customerDomainRulesQueryOptions = (kind: CustomerDomainRuleKind) =>
  api.customerDomainRule.list.queryOptions({ input: { kind } });

/** Adds a custom excluded or generic domain rule. */
export const addCustomerDomainRuleMutationOptions = () =>
  api.customerDomainRule.add.mutationOptions();

/** Removes a custom domain rule from the current Workspace. */
export const removeCustomerDomainRuleMutationOptions = () =>
  api.customerDomainRule.remove.mutationOptions();

/** Lists Customer statuses in display order. */
export const customerStatusesQueryOptions = () => api.customerStatus.list.queryOptions();

/** Creates a Customer status in the current Workspace. */
export const createCustomerStatusMutationOptions = () =>
  api.customerStatus.create.mutationOptions();

/** Updates one Customer status in the current Workspace. */
export const updateCustomerStatusMutationOptions = () =>
  api.customerStatus.update.mutationOptions();

/** Deletes one Customer status, optionally moving Customers to another status. */
export const deleteCustomerStatusMutationOptions = () =>
  api.customerStatus.delete.mutationOptions();

/** Reorders the complete Customer status list. */
export const reorderCustomerStatusesMutationOptions = () =>
  api.customerStatus.reorder.mutationOptions();

/** Lists Customer tiers in display order. */
export const customerTiersQueryOptions = () => api.customerTier.list.queryOptions();

/** Creates a Customer tier in the current Workspace. */
export const createCustomerTierMutationOptions = () => api.customerTier.create.mutationOptions();

/** Updates one Customer tier in the current Workspace. */
export const updateCustomerTierMutationOptions = () => api.customerTier.update.mutationOptions();

/** Deletes one Customer tier in the current Workspace. */
export const deleteCustomerTierMutationOptions = () => api.customerTier.delete.mutationOptions();

/** Reorders the complete Customer tier list. */
export const reorderCustomerTiersMutationOptions = () => api.customerTier.reorder.mutationOptions();
