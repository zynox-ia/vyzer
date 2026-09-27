/** Aplica as migrations pendentes. Uso: `pnpm db:migrate` na raiz. */
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "./index";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida.");

const db = createDb(url);
await migrate(db, { migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)) });
await db.$client.end();
console.log("Migrations aplicadas.");
