/**
 * Seed fictício PT — NUNCA usar dados reais aqui.
 * Execução (quando DATABASE_URL existir):
 *   pnpm db:seed
 */
import postgres from "postgres";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL;
if (!url) {
    console.error("DATABASE_URL em falta. Configure a ligação PostgreSQL e volte a correr.");
  process.exit(1);
}

const sql = postgres(url, { ssl: process.env.DATABASE_SSL === "false" ? false : "require" });

const FIRST = ["Ana", "Beatriz", "Carlos", "Diogo", "Eva", "Francisco", "Gabriela", "Henrique", "Inês", "João", "Leonor", "Miguel", "Mariana", "Pedro", "Rafaela", "Tiago", "Sofia", "Tomás", "Vera", "Xavier"];
const LAST = ["Silva", "Santos", "Ferreira", "Costa", "Oliveira", "Martins", "Sousa", "Pereira", "Almeida", "Carvalho"];

async function main() {
  const schoolId = crypto.randomUUID();
  await sql`INSERT INTO schools (id, name, timezone) VALUES (${schoolId}, 'Escola Demo (fictícia)', 'Europe/Lisbon')`;

  const yearId = crypto.randomUUID();
  await sql`INSERT INTO school_years (id, school_id, name, starts_on, ends_on, is_active)
    VALUES (${yearId}, ${schoolId}, '2025/2026', '2025-09-01', '2026-08-31', TRUE)`;
  await sql`UPDATE schools SET active_school_year_id = ${yearId} WHERE id = ${schoolId}`;

  for (const p of [
    { code: "students.read", description: "Consultar alunos (âmbito do papel)" },
    { code: "students.write", description: "Criar/editar alunos" },
    { code: "referrals.create", description: "Submeter sinalizações" },
    { code: "referrals.read.own", description: "Ver as próprias sinalizações" },
    { code: "referrals.read.all", description: "Ver todas as sinalizações (SPO)" },
    { code: "referrals.triage", description: "Triar sinalizações (SPO)" },
    { code: "cases.read", description: "Consultar casos e cronologia" },
    { code: "cases.write", description: "Criar/editar/encerrar casos" },
    { code: "cases.assign", description: "Atribuir equipa ao caso" },
    { code: "appointments.read", description: "Consultar agenda" },
    { code: "appointments.write", description: "Criar/editar atendimentos" },
    { code: "tasks.read", description: "Consultar tarefas" },
    { code: "tasks.write", description: "Criar/editar tarefas" },
    { code: "documents.read", description: "Consultar documentos" },
    { code: "documents.write", description: "Carregar documentos" },
    { code: "users.manage", description: "Gerir utilizadores" },
    { code: "roles.manage", description: "Gerir papéis e permissões" },
    { code: "audit.read", description: "Consultar auditoria" },
    { code: "settings.manage", description: "Gerir definições SPO" },
    { code: "orientation.read", description: "Consultar processos de orientação" },
    { code: "orientation.write", description: "Gerir processos de orientação" },
    { code: "reports.read", description: "Consultar relatórios e métricas" },
  ]) {
    await sql`INSERT INTO permissions (code, description) VALUES (${p.code}, ${p.description}) ON CONFLICT (code) DO NOTHING`;
  }

  // 4 papéis de sistema (o Administrador NÃO recebe permissões clínicas).
  const roleDefs: { code: string; name: string; perms: string[] }[] = [
    {
      code: "SPO_PSYCHOLOGIST",
      name: "Psicólogo/a SPO",
      perms: [
        "students.read", "students.write", "referrals.create", "referrals.read.own",
        "referrals.read.all", "referrals.triage", "cases.read", "cases.write", "cases.assign",
        "appointments.read", "appointments.write", "tasks.read", "tasks.write",
        "documents.read", "documents.write", "orientation.read", "orientation.write",
        "reports.read", "audit.read",
      ],
    },
    {
      code: "GUIDANCE_COUNSELOR",
      name: "Orientador/a Educacional",
      perms: [
        "students.read", "referrals.create", "referrals.read.own",
        "orientation.read", "orientation.write", "tasks.read", "tasks.write",
      ],
    },
    {
      code: "TEACHER",
      name: "Professor/Docente",
      perms: ["students.read", "referrals.create", "referrals.read.own", "tasks.read"],
    },
    {
      code: "ADMINISTRATOR",
      name: "Administrador",
      perms: ["users.manage", "roles.manage", "audit.read", "settings.manage"],
    },
  ];
  const roleIds: Record<string, string> = {};
  for (const r of roleDefs) {
    const id = crypto.randomUUID();
    roleIds[r.code] = id;
    await sql`INSERT INTO roles (id, school_id, code, name, is_system_role) VALUES (${id}, ${schoolId}, ${r.code}, ${r.name}, TRUE)`;
    for (const code of r.perms) {
      const row = await sql`SELECT id FROM permissions WHERE code = ${code}`;
      if (row[0]) await sql`INSERT INTO role_permissions (role_id, permission_id) VALUES (${id}, ${row[0].id}) ON CONFLICT DO NOTHING`;
    }
  }

  const initialPassword = process.env.INITIAL_PSYCHOLOGIST_PASSWORD;
  if (!initialPassword) throw new Error("INITIAL_PSYCHOLOGIST_PASSWORD é obrigatória para executar o seed.");
  const hash = await bcrypt.hash(initialPassword, 12);
  const psychId = crypto.randomUUID();
  const psychEmail = process.env.INITIAL_PSYCHOLOGIST_EMAIL || "psicologa@escola-demo.pt";
  await sql`INSERT INTO profiles (id, school_id, name, email, password_hash)
    VALUES (${psychId}, ${schoolId}, 'Dra. Helena fictitious', ${psychEmail}, ${hash})`;
  await sql`INSERT INTO user_roles (profile_id, role_id)
    VALUES (${psychId}, ${roleIds["SPO_PSYCHOLOGIST"]})`;

  let referralSubmitter = psychId;
  if (process.env.SEED_DEMO_USERS === "true") {
    const counId = crypto.randomUUID();
    const teachAId = crypto.randomUUID();
    const teachBId = crypto.randomUUID();
    const adminId = crypto.randomUUID();
    await sql`INSERT INTO profiles (id, school_id, name, email, password_hash) VALUES
      (${counId}, ${schoolId}, 'Dr. Nuno fictitious', 'orientador@escola-demo.pt', ${hash}),
      (${teachAId}, ${schoolId}, 'Prof. Rui fictitious', 'dt@escola-demo.pt', ${hash}),
      (${teachBId}, ${schoolId}, 'Profª. Carla fictitious', 'dt2@escola-demo.pt', ${hash}),
      (${adminId}, ${schoolId}, 'Admin fictitious', 'admin@escola-demo.pt', ${hash})`;
    await sql`INSERT INTO user_roles (profile_id, role_id) VALUES
      (${counId}, ${roleIds["GUIDANCE_COUNSELOR"]}),
      (${teachAId}, ${roleIds["TEACHER"]}),
      (${teachBId}, ${roleIds["TEACHER"]}),
      (${adminId}, ${roleIds["ADMINISTRATOR"]})`;
    await sql`INSERT INTO class_director_assignments (school_id, profile_id, class_name, school_year_id) VALUES
      (${schoolId}, ${teachAId}, '7.ºA', ${yearId}), (${schoolId}, ${teachBId}, '8.ºB', ${yearId})`;
    referralSubmitter = teachAId;
  }

  const classes = ["7.ºA", "7.ºA", "7.ºA", "7.ºA", "7.ºA", "7.ºA", "7.ºA", "7.ºA", "7.ºA", "7.ºA", "8.ºB", "8.ºB", "8.ºB", "8.ºB", "8.ºB", "8.ºB", "8.ºB", "8.ºB", "8.ºB", "8.ºB"];
  const studentIds: string[] = [];
  for (let i = 0; i < 20; i++) {
    const id = crypto.randomUUID();
    studentIds.push(id);
    const name = `${FIRST[i]} ${LAST[i % LAST.length]} fictitious`;
    const num = `2025${String(100 + i)}`;
    const dob = `20${10 + (i % 5)}-0${1 + (i % 9)}-1${i % 9}`;
    await sql`INSERT INTO students (id, school_id, student_number, full_name, date_of_birth, class_name, school_year_id, created_by)
      VALUES (${id}, ${schoolId}, ${num}, ${name}, ${dob}, ${classes[i]}, ${yearId}, ${psychId})`;
  }

  const cats = ["bem_estar_emocional", "absentismo", "comportamento", "dificuldades_aprendizagem", "orientacao_vocacional"];
  const statuses = ["RECEBIDA", "EM_ANALISE", "SPO_ACOMPANHAMENTO", "ENCERRADA", "RECEBIDA"];
  for (let i = 0; i < 5; i++) {
    await sql`INSERT INTO referrals (school_id, student_id, submitted_by, category, factual_description, urgency, status)
      VALUES (${schoolId}, ${studentIds[i]}, ${referralSubmitter}, ${cats[i]}, ${"Descrição factual fictícia para demonstração. Sem conteúdo clínico real. ".repeat(2)}, 'normal', ${statuses[i]})`;
  }

  console.log("Seed concluído (dados fictícios). Escola:", schoolId);
  await sql.end();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
