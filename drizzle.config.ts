import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Fornecido pelo ambiente. drizzle-kit só precisa disto para gerar/aplicar.
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/spo_placeholder",
  },
});
