import { defineConfig } from "drizzle-kit";

// `generate` não conecta ao banco; os comandos que conectam exigem DATABASE_URL.
const url = process.env.DATABASE_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema.ts",
  out: "./migrations",
  ...(url ? { dbCredentials: { url } } : {}),
});
