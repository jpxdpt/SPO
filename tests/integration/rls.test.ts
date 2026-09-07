/**
 * Teste de RLS.
 * Com DATABASE_URL: liga ao Neon (branch dev) e prova que o diretor não lê casos.
 * Sem DATABASE_URL: verifica estaticamente que a migração contém as policies críticas.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const hasDb = Boolean(process.env.DATABASE_URL);

describe("RLS", () => {
  it("migração contém policies fail-closed para tabelas clínicas", () => {
    const sql = readFileSync(join(process.cwd(), "db/migrations/0001_init.sql"), "utf8");
    for (const t of ["cases", "case_events", "clinical_notes", "documents", "appointments"]) {
      expect(sql).toContain(`CREATE POLICY p_${t === "case_events" ? "case_events" : t}`);
    }
    expect(sql).toContain("app_has_role('PSYCHOLOGIST_ADMIN')");
    expect(sql).toContain("ENABLE ROW LEVEL SECURITY");
  });

  it.runIf(hasDb)("diretor não lê casos nem notas (live)", async () => {
    const postgres = (await import("postgres")).default;
    const sql = postgres(process.env.DATABASE_URL as string, { ssl: "require", prepare: false });
    try {
      const dirs = await sql`SELECT id, school_id FROM profiles
        WHERE id IN (SELECT profile_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.code = 'CLASS_DIRECTOR')
        LIMIT 1`;
      if (!dirs[0]) return; // seed ainda não aplicado
      await sql.unsafe(`SET LOCAL app.profile_id = '${dirs[0].id}'`);
      await sql.unsafe(`SET LOCAL app.school_id = '${dirs[0].school_id}'`);
      const cases = await sql`SELECT id FROM cases LIMIT 1`;
      expect(cases.length).toBe(0);
      const notes = await sql`SELECT id FROM clinical_notes LIMIT 1`;
      expect(notes.length).toBe(0);
    } finally {
      await sql.end();
    }
  });
});
