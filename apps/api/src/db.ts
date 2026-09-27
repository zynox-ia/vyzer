import { createDb } from "@vyzer/db";
import { env } from "./env";

/** Conexão única da API com o banco. */
export const db = createDb(env.databaseUrl);
