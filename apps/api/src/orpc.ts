import { implement } from "@orpc/server";
import { contract } from "@vyzer/contract";
import type { Db } from "@vyzer/db";

/** Contexto de cada chamada: banco e headers da requisição (a sessão sai deles). */
export type Context = { db: Db; headers: Headers };

/** Base de todos os procedimentos; middlewares compartilhados partem daqui. */
export const base = implement(contract).$context<Context>();
