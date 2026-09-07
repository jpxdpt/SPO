import postgres from "postgres";
import type { TransactionSql } from "postgres";

declare global {
  var __spoSql: ReturnType<typeof postgres> | undefined;
}

/** Cliente lazy: build não exige DATABASE_URL (fornecida depois). */
export function getSql() {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL);
  if (!databaseUrl) {
    throw new Error("DATABASE_URL em falta. Configure a ligação PostgreSQL no ambiente.");
  }
  if (!globalThis.__spoSql) {
    globalThis.__spoSql = postgres(databaseUrl, {
      ssl: process.env.DATABASE_SSL === "false" ? false : "require",
      max: 5,
      prepare: false,
    });
  }
  return globalThis.__spoSql;
}

/** Evita falhas quando o painel de env recebe a URL com aspas/espaços colados. */
export function normalizeDatabaseUrl(value: string | undefined): string {
  return (value ?? "").trim().replace(/^("|')|("|')$/g, "");
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
  return Boolean(normalizeDatabaseUrl(process.env.DATABASE_URL));
}
