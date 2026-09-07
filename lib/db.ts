import postgres from "postgres";
import type { TransactionSql } from "postgres";

declare global {
  var __spoSql: ReturnType<typeof postgres> | undefined;
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

/** Corre uma transação com contexto RLS (SET LOCAL). Fail-closed sem contexto. */
export async function withRls<T>(
  profileId: string,
  schoolId: string,
  fn: (tx: TransactionSql) => Promise<T>
): Promise<T> {
  return getSql().begin<T>(async (tx) => {
    await tx.unsafe("SELECT set_config('app.profile_id', $1, true)", [profileId]);
    await tx.unsafe("SELECT set_config('app.school_id', $1, true)", [schoolId]);
    return fn(tx);
  }) as Promise<T>;
}

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
