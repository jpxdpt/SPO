import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/db/schema";

declare global {
  var __spoSql: ReturnType<typeof postgres> | undefined;
  var __spoDb: ReturnType<typeof drizzle> | undefined;
}

/** Cliente lazy: build não exige DATABASE_URL (fornecida depois). */
export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL em falta. Configure o Neon (branch dev) no .env.local.");
  }
  if (!globalThis.__spoSql) {
    globalThis.__spoSql = postgres(process.env.DATABASE_URL, {
      ssl: "require",
      max: 5,
      prepare: false,
    });
  }
  return globalThis.__spoSql;
}

export function getDb() {
  if (!globalThis.__spoDb) {
    globalThis.__spoDb = drizzle(getSql(), { schema });
  }
  return globalThis.__spoDb;
}

/** Corre uma transação com contexto RLS (SET LOCAL). Fail-closed sem contexto. */
export async function withRls<T>(
  profileId: string,
  schoolId: string,
  fn: (tx: Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0]) => Promise<T>
): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(`SET LOCAL app.profile_id = '${profileId}'`);
    await tx.execute(`SET LOCAL app.school_id = '${schoolId}'`);
    return fn(tx as never);
  });
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
