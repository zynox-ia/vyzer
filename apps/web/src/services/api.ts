/** Cliente tipado da API (oRPC), a partir do contrato compartilhado. Ver ADR-0004. */
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { ApiClient } from "@vyzer/contract";

const link = new RPCLink({ url: `${window.location.origin}/api/rpc` });

const client: ApiClient = createORPCClient(link);

/** Opções do TanStack Query para cada procedimento (`api.health.queryOptions()`). */
export const api = createTanstackQueryUtils(client);
