import { ORPCError } from "@orpc/server";
import {
  addCustomerDomainRule,
  createCustomerStatus,
  createCustomerTier,
  customerDomainRule,
  customerSettings,
  customerStatus,
  customerTier,
  deleteCustomerStatus,
  deleteCustomerTier,
  getOrCreateCustomerSettings,
  listCustomerDomainRules,
  listCustomerStatuses,
  listCustomerTiers,
  removeCustomerDomainRule,
  reorderCustomerStatuses,
  reorderCustomerTiers,
  updateCustomerSettings,
  updateCustomerStatus,
  updateCustomerTier,
} from "@vyzer/db";
import type { createWorkspaceMiddleware } from "./orpc";

type Middleware = ReturnType<typeof createWorkspaceMiddleware>;

function settingsOutput(row: typeof customerSettings.$inferSelect) {
  return {
    workspaceId: row.workspaceId,
    enabled: row.enabled,
    defaultTeamId: row.defaultTeamId,
    revenuePeriod: row.revenuePeriod,
    revenueCurrency: row.revenueCurrency,
    attributesDataSource: row.attributesDataSource,
    manualEditsEnabled: row.manualEditsEnabled,
  };
}

function statusOutput(row: typeof customerStatus.$inferSelect) {
  return { id: row.id, name: row.name, color: row.color, position: row.position };
}

function tierOutput(row: typeof customerTier.$inferSelect) {
  return { id: row.id, name: row.name, color: row.color, position: row.position };
}

function domainRuleOutput(row: typeof customerDomainRule.$inferSelect) {
  return {
    id: row.id,
    kind: row.kind,
    value: row.value,
    createdAt: row.createdAt.toISOString(),
  };
}

function isUniqueConstraintViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  if ("code" in error && error.code === "23505") return true;
  return "cause" in error && isUniqueConstraintViolation(error.cause);
}

function throwOnUniqueViolation(error: unknown, message: string): never {
  if (isUniqueConstraintViolation(error)) throw new ORPCError("CONFLICT", { message });
  throw error;
}

export function createCustomerSettingsRouter(middleware: Middleware) {
  return {
    customerSettings: {
      get: middleware.workspaceScoped.customerSettings.get.handler(async ({ context }) => {
        const settings = await getOrCreateCustomerSettings(context.db, context.workspace.id);
        if (!settings) throw new ORPCError("INTERNAL_SERVER_ERROR");
        return settingsOutput(settings);
      }),
      update: middleware.adminOnly.customerSettings.update.handler(async ({ context, input }) => {
        const updated = await updateCustomerSettings(context.db, context.workspace.id, input);
        if (!updated) throw new ORPCError("NOT_FOUND");
        return settingsOutput(updated);
      }),
    },
    customerDomainRule: {
      list: middleware.workspaceScoped.customerDomainRule.list.handler(async ({ context, input }) =>
        (await listCustomerDomainRules(context.db, context.workspace.id, input.kind)).map(
          domainRuleOutput,
        ),
      ),
      add: middleware.adminOnly.customerDomainRule.add.handler(async ({ context, input }) => {
        try {
          const created = await addCustomerDomainRule(
            context.db,
            context.workspace.id,
            input.kind,
            input.value,
          );
          if (!created) throw new ORPCError("INTERNAL_SERVER_ERROR");
          return domainRuleOutput(created);
        } catch (error) {
          throwOnUniqueViolation(error, "This domain or email is already in the list.");
        }
      }),
      remove: middleware.adminOnly.customerDomainRule.remove.handler(async ({ context, input }) => {
        const removed = await removeCustomerDomainRule(context.db, context.workspace.id, input.id);
        if (!removed) throw new ORPCError("NOT_FOUND");
      }),
    },
    customerStatus: {
      list: middleware.workspaceScoped.customerStatus.list.handler(async ({ context }) =>
        (await listCustomerStatuses(context.db, context.workspace.id)).map(statusOutput),
      ),
      create: middleware.adminOnly.customerStatus.create.handler(async ({ context, input }) => {
        try {
          const created = await createCustomerStatus(context.db, context.workspace.id, input);
          if (!created) throw new ORPCError("INTERNAL_SERVER_ERROR");
          return statusOutput(created);
        } catch (error) {
          throwOnUniqueViolation(error, "A Customer status with this name already exists.");
        }
      }),
      update: middleware.adminOnly.customerStatus.update.handler(async ({ context, input }) => {
        const { id, ...values } = input;
        try {
          const updated = await updateCustomerStatus(context.db, context.workspace.id, id, values);
          if (!updated) throw new ORPCError("NOT_FOUND");
          return statusOutput(updated);
        } catch (error) {
          throwOnUniqueViolation(error, "A Customer status with this name already exists.");
        }
      }),
      delete: middleware.adminOnly.customerStatus.delete.handler(async ({ context, input }) => {
        const result = await deleteCustomerStatus(
          context.db,
          context.workspace.id,
          input.id,
          input.moveTo,
        );

        if (result.status === "not-found" || result.status === "target-not-found") {
          throw new ORPCError("NOT_FOUND");
        }
        if (result.status === "same-target") {
          throw new ORPCError("BAD_REQUEST", { message: "Choose a different status." });
        }
        if (result.status === "last-status") {
          throw new ORPCError("CONFLICT", {
            message: "A Workspace must keep at least one Customer status.",
          });
        }
      }),
      reorder: middleware.adminOnly.customerStatus.reorder.handler(async ({ context, input }) => {
        const reordered = await reorderCustomerStatuses(
          context.db,
          context.workspace.id,
          input.ids,
        );
        if (!reordered) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Reorder must include every status in this Workspace exactly once.",
          });
        }
      }),
    },
    customerTier: {
      list: middleware.workspaceScoped.customerTier.list.handler(async ({ context }) =>
        (await listCustomerTiers(context.db, context.workspace.id)).map(tierOutput),
      ),
      create: middleware.adminOnly.customerTier.create.handler(async ({ context, input }) => {
        try {
          const created = await createCustomerTier(context.db, context.workspace.id, input);
          if (!created) throw new ORPCError("INTERNAL_SERVER_ERROR");
          return tierOutput(created);
        } catch (error) {
          throwOnUniqueViolation(error, "A Customer tier with this name already exists.");
        }
      }),
      update: middleware.adminOnly.customerTier.update.handler(async ({ context, input }) => {
        const { id, ...values } = input;
        try {
          const updated = await updateCustomerTier(context.db, context.workspace.id, id, values);
          if (!updated) throw new ORPCError("NOT_FOUND");
          return tierOutput(updated);
        } catch (error) {
          throwOnUniqueViolation(error, "A Customer tier with this name already exists.");
        }
      }),
      delete: middleware.adminOnly.customerTier.delete.handler(async ({ context, input }) => {
        const removed = await deleteCustomerTier(context.db, context.workspace.id, input.id);
        if (!removed) throw new ORPCError("NOT_FOUND");
      }),
      reorder: middleware.adminOnly.customerTier.reorder.handler(async ({ context, input }) => {
        const reordered = await reorderCustomerTiers(context.db, context.workspace.id, input.ids);
        if (!reordered) {
          throw new ORPCError("BAD_REQUEST", {
            message: "Reorder must include every tier in this Workspace exactly once.",
          });
        }
      }),
    },
  };
}
