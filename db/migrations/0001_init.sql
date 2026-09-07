-- SPO Gestão — migração 0001 (Neon Postgres)
-- Fase 1 + Fase 2. Aplicar com: psql $DATABASE_URL -f db/migrations/0001_init.sql
-- (ou drizzle-kit migrate quando DATABASE_URL estiver configurada).
-- Datas em UTC; apresentação em Europe/Lisbon na app.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ NÚCLEO ============
CREATE TABLE IF NOT EXISTS schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Europe/Lisbon',
  active_school_year_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_years (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  is_system_role BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_roles (
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  granted_by UUID REFERENCES profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (profile_id, role_id)
);

-- ============ ALUNOS ============
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_number TEXT NOT NULL,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  class_name TEXT NOT NULL,
  school_year_id UUID REFERENCES school_years(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (school_id, student_number)
);
CREATE INDEX IF NOT EXISTS idx_students_school_number ON students (school_id, student_number);
CREATE INDEX IF NOT EXISTS idx_students_school_name ON students (school_id, full_name);
CREATE INDEX IF NOT EXISTS idx_students_class ON students (school_id, class_name);

CREATE TABLE IF NOT EXISTS class_director_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_name TEXT NOT NULL,
  school_year_id UUID REFERENCES school_years(id),
  starts_on DATE,
  ends_on DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cda_profile ON class_director_assignments (profile_id, school_id);

CREATE TABLE IF NOT EXISTS guardians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  preferred_channel TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS student_guardians (
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES guardians(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (student_id, guardian_id)
);

-- ============ SINALIZAÇÕES / CASOS ============
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  submitted_by UUID NOT NULL REFERENCES profiles(id),
  category TEXT NOT NULL,
  factual_description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'RECEBIDA',
  triaged_by UUID REFERENCES profiles(id),
  triaged_at TIMESTAMPTZ,
  outcome TEXT,
  safe_response_to_referrer TEXT,
  contact_for_clarification TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referrals_school_status_created ON referrals (school_id, status, created_at);
CREATE INDEX IF NOT EXISTS idx_referrals_student ON referrals (student_id);

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  source_referral_id UUID REFERENCES referrals(id),
  status TEXT NOT NULL DEFAULT 'ATIVO',
  main_reason TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  close_reason TEXT,
  close_summary TEXT,
  forward_destination TEXT,
  next_review_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cases_student_status ON cases (student_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_school_status ON cases (school_id, status);

CREATE TABLE IF NOT EXISTS case_assignments (
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_in_case TEXT NOT NULL DEFAULT 'responsavel',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  PRIMARY KEY (case_id, profile_id)
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  room TEXT,
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  owner_id UUID NOT NULL REFERENCES profiles(id),
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (starts_at < ends_at)
);
CREATE INDEX IF NOT EXISTS idx_appointments_owner_start ON appointments (owner_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_appointments_case ON appointments (case_id, starts_at);

CREATE TABLE IF NOT EXISTS case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'TEAM',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_events_case ON case_events (case_id, occurred_at);

CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_event_id UUID NOT NULL UNIQUE REFERENCES case_events(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'PSYCHOLOGIST_ONLY',
  author_id UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES profiles(id),
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'PENDENTE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks (assignee_id, status, due_at);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'TEAM',
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  safe_text TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json JSONB,
  ip_hash TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_school_time ON audit_events (school_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events (entity_type, entity_id);

-- ============ RLS ============
-- Contexto por transação (a app define após abrir transação):
--   SET LOCAL app.profile_id = '<uuid>'; SET LOCAL app.school_id = '<uuid>';
-- Sem contexto, nenhuma linha é visível (fail-closed).

CREATE OR REPLACE FUNCTION app_current_profile() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.profile_id', TRUE), '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_current_school() RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.school_id', TRUE), '')::UUID;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_has_role(role_code TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.profile_id = app_current_profile() AND r.code = role_code
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION app_teaches_class(p_class TEXT) RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_director_assignments a
    WHERE a.profile_id = app_current_profile()
      AND a.class_name = p_class
      AND (a.ends_on IS NULL OR a.ends_on >= CURRENT_DATE)
  );
$$ LANGUAGE sql STABLE;

-- Ativar RLS em tudo
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_director_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- Políticas: psicóloga admin vê tudo da sua escola; diretor só o seu âmbito.
-- (Aplicação se encarrega de SET LOCAL; policies fail-closed sem contexto.)

DROP POLICY IF EXISTS p_schools ON schools;
CREATE POLICY p_schools ON schools FOR ALL USING (id = app_current_school());

DROP POLICY IF EXISTS p_profiles ON profiles;
CREATE POLICY p_profiles ON profiles FOR ALL USING (
  school_id = app_current_school() AND (
    app_has_role('PSYCHOLOGIST_ADMIN') OR id = app_current_profile()
  )
);

DROP POLICY IF EXISTS p_students ON students;
CREATE POLICY p_students ON students FOR ALL USING (
  school_id = app_current_school() AND (
    app_has_role('PSYCHOLOGIST_ADMIN') OR app_teaches_class(class_name)
  )
);

DROP POLICY IF EXISTS p_referrals ON referrals;
CREATE POLICY p_referrals ON referrals FOR ALL USING (
  school_id = app_current_school() AND (
    app_has_role('PSYCHOLOGIST_ADMIN') OR submitted_by = app_current_profile()
  )
);

-- Casos e tudo o que é clínico: SÓ psicóloga admin. Diretores não conseguem
-- sequer inferir existência (0 linhas, sem erro distinto).
DROP POLICY IF EXISTS p_cases ON cases;
CREATE POLICY p_cases ON cases FOR ALL USING (
  school_id = app_current_school() AND app_has_role('PSYCHOLOGIST_ADMIN')
);
DROP POLICY IF EXISTS p_case_assignments ON case_assignments;
CREATE POLICY p_case_assignments ON case_assignments FOR ALL USING (
  app_has_role('PSYCHOLOGIST_ADMIN')
);
DROP POLICY IF EXISTS p_appointments ON appointments;
CREATE POLICY p_appointments ON appointments FOR ALL USING (
  school_id = app_current_school() AND app_has_role('PSYCHOLOGIST_ADMIN')
);
DROP POLICY IF EXISTS p_case_events ON case_events;
CREATE POLICY p_case_events ON case_events FOR ALL USING (
  school_id = app_current_school() AND app_has_role('PSYCHOLOGIST_ADMIN')
);
DROP POLICY IF EXISTS p_clinical_notes ON clinical_notes;
CREATE POLICY p_clinical_notes ON clinical_notes FOR ALL USING (
  app_has_role('PSYCHOLOGIST_ADMIN')
);
DROP POLICY IF EXISTS p_documents ON documents;
CREATE POLICY p_documents ON documents FOR ALL USING (
  school_id = app_current_school() AND app_has_role('PSYCHOLOGIST_ADMIN')
);
DROP POLICY IF EXISTS p_guardians ON guardians;
CREATE POLICY p_guardians ON guardians FOR ALL USING (
  school_id = app_current_school() AND app_has_role('PSYCHOLOGIST_ADMIN')
);
DROP POLICY IF EXISTS p_student_guardians ON student_guardians;
CREATE POLICY p_student_guardians ON student_guardians FOR ALL USING (
  app_has_role('PSYCHOLOGIST_ADMIN')
);

DROP POLICY IF EXISTS p_tasks ON tasks;
CREATE POLICY p_tasks ON tasks FOR ALL USING (
  school_id = app_current_school() AND (
    app_has_role('PSYCHOLOGIST_ADMIN') OR assignee_id = app_current_profile()
  )
);

DROP POLICY IF EXISTS p_notifications ON notifications;
CREATE POLICY p_notifications ON notifications FOR ALL USING (
  profile_id = app_current_profile()
);

DROP POLICY IF EXISTS p_audit ON audit_events;
CREATE POLICY p_audit ON audit_events FOR SELECT USING (
  (school_id = app_current_school() OR school_id IS NULL)
  AND app_has_role('PSYCHOLOGIST_ADMIN')
);

-- Tabelas de configuração: leitura na escola; escrita só admin (a app reforça).
DROP POLICY IF EXISTS p_school_years ON school_years;
CREATE POLICY p_school_years ON school_years FOR ALL USING (school_id = app_current_school());
DROP POLICY IF EXISTS p_cda ON class_director_assignments;
CREATE POLICY p_cda ON class_director_assignments FOR ALL USING (
  school_id = app_current_school() AND (
    app_has_role('PSYCHOLOGIST_ADMIN') OR profile_id = app_current_profile()
  )
);
DROP POLICY IF EXISTS p_roles ON roles;
CREATE POLICY p_roles ON roles FOR ALL USING (school_id = app_current_school());
DROP POLICY IF EXISTS p_permissions ON permissions;
CREATE POLICY p_permissions ON permissions FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS p_role_permissions ON role_permissions;
CREATE POLICY p_role_permissions ON role_permissions FOR SELECT USING (TRUE);
DROP POLICY IF EXISTS p_user_roles ON user_roles;
CREATE POLICY p_user_roles ON user_roles FOR SELECT USING (TRUE);
