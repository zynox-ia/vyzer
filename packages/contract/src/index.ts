/** Contrato da API compartilhado entre apps/api e apps/web. Ver ADR-0004. */
import { oc, type ContractRouterClient } from "@orpc/contract";
import { z } from "zod";

export const contract = {
  /** Confirma que a API está no ar e alcança o banco. */
  health: oc.output(
    z.object({
      status: z.literal("ok"),
      database: z.literal("ok"),
    }),
  ),
};

export type Contract = typeof contract;

/** Tipo do cliente da API usado pelo front. */
export type ApiClient = ContractRouterClient<Contract>;
