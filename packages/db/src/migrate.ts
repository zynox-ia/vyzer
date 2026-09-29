/** Aplica as migrations pendentes. Uso: `pnpm db:migrate` na raiz. */
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDb } from "./index";
import { seedWorkspace } from "./seed";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não definida.");

const db = createDb(url);
try {
  await migrate(db, { migrationsFolder: fileURLToPath(new URL("../migrations", import.meta.url)) });
  await seedWorkspace(db);
} finally {
  await db.$client.end();
}
console.log("Migrations aplicadas.");
