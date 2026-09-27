import { api } from "./api";

/** Estado da API e do banco. Sem novas tentativas: o diagnóstico mostra a falha na hora. */
export const healthQuery = () => api.health.queryOptions({ retry: false });
