/**
 * Teste de RLS (migrações 0001 + 0002).
 * Com DATABASE_URL: liga ao Neon (branch dev) e prova que docente/orientador/
 * administrador não leem casos nem notas.
 * Sem DATABASE_URL: verifica estaticamente que as migrações contêm as policies críticas.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const hasDb = Boolean(process.env.DATABASE_URL);

function migration(n: string): string {
  return readFileSync(join(process.cwd(), `db/migrations/${n}`), "utf8");
}

describe("RLS", () => {
  it("migração 0001 contém base fail-closed", () => {
    const sql = migration("0001_init.sql");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
    expect(sql).toContain("app.profile_id");
  });

  it("migração 0002 restringe clínico ao psicólogo e isola o administrador", () => {
    const sql = migration("0002_roles.sql");
    for (const t of ["p_cases", "p_case_events", "p_clinical_notes", "p_documents", "p_appointments"]) {
      expect(sql).toContain(`CREATE POLICY ${t}`);
    }
    expect(sql).toContain("app_is_psych()");
    // Orientador vê base de alunos; clínico continua só psicólogo
    expect(sql).toContain("GUIDANCE_COUNSELOR");
    expect(sql).toContain("ADMINISTRATOR");
  });

  it.runIf(hasDb)("perfis não clínicos não leem casos nem notas (live)", async () => {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL as string, { ssl: "require", prepare: false });
    try {
      for (const code of ["TEACHER", "GUIDANCE_COUNSELOR", "ADMINISTRATOR"]) {
        const rows = await sql`SELECT p.id, p.school_id FROM profiles p
          WHERE p.id IN (SELECT ur.profile_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.code = ${code})
          LIMIT 1`;
        if (!rows[0]) continue; // seed ainda não aplicado
        await sql.unsafe(`SET LOCAL app.profile_id = '${(rows[0] as { id: string }).id}'`);
        await sql.unsafe(`SET LOCAL app.school_id = '${(rows[0] as { school_id: string }).school_id}'`);
        const cases = await sql`SELECT id FROM cases LIMIT 1`;
        expect(cases.length).toBe(0);
        const notes = await sql`SELECT id FROM clinical_notes LIMIT 1`;
        expect(notes.length).toBe(0);
      }
    } finally {
      await sql.end();
    }
  });
});
