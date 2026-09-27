/** Acesso ao banco (Drizzle + postgres.js). Ver ADR-0005. */
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/** Segundos para desistir de abrir uma conexão (o padrão do postgres.js é 30). */
const CONNECT_TIMEOUT_SECONDS = 5;

export function createDb(url: string) {
  return drizzle({ client: postgres(url, { connect_timeout: CONNECT_TIMEOUT_SECONDS }), schema });
}

export type Db = ReturnType<typeof createDb>;

/** Faz uma consulta trivial; lança erro se o banco não responder. */
export async function checkConnection(db: Db): Promise<void> {
  await db.execute(sql`select 1`);
}
