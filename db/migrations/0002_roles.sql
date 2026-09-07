-- SPO Gestão — migração 0002 (Neon Postgres)
-- Modelo de 4 perfis: SPO_PSYCHOLOGIST, GUIDANCE_COUNSELOR, TEACHER, ADMINISTRATOR.
-- O Administrador gere a plataforma e NÃO tem acesso a conteúdo clínico.
-- Aplicar após 0001: psql $DATABASE_URL -f db/migrations/0002_roles.sql

-- Novos códigos de permissão (o seed também os insere; aqui por idempotência)
INSERT INTO permissions (code, description) VALUES
  ('orientation.read', 'Consultar processos de orientação'),
  ('orientation.write', 'Gerir processos de orientação'),
  ('reports.read', 'Consultar relatórios e métricas')
ON CONFLICT (code) DO NOTHING;

-- Função auxiliar: perfil clínico SPO
CREATE OR REPLACE FUNCTION app_is_psych() RETURNS BOOLEAN AS $$
  SELECT app_has_role('SPO_PSYCHOLOGIST');
$$ LANGUAGE sql STABLE;

-- ============ ALUNOS ============
-- Psicólogo: tudo. Orientador: identificação base da escola (só o necessário
-- à orientação; sem casos/notas). Professor: só turmas atribuídas.
DROP POLICY IF EXISTS p_students ON students;
CREATE POLICY p_students ON students FOR ALL USING (
  school_id = app_current_school() AND (
    app_is_psych()
    OR app_has_role('GUIDANCE_COUNSELOR')
    OR app_teaches_class(class_name)
  )
);

-- ============ SINALIZAÇÕES ============
-- Psicólogo: todas. Orientador/professor: só as próprias.
DROP POLICY IF EXISTS p_referrals ON referrals;
CREATE POLICY p_referrals ON referrals FOR ALL USING (
  school_id = app_current_school() AND (
    app_is_psych() OR submitted_by = app_current_profile()
  )
);

-- ============ CLÍNICO (só psicólogo) ============
-- Casos, equipa, atendimentos, eventos, notas, documentos, EE: SPO_PSYCHOLOGIST.
-- Orientador, professor e administrador obtêm 0 linhas (sem oráculo de existência).
DROP POLICY IF EXISTS p_cases ON cases;
CREATE POLICY p_cases ON cases FOR ALL USING (
  school_id = app_current_school() AND app_is_psych()
);
DROP POLICY IF EXISTS p_case_assignments ON case_assignments;
CREATE POLICY p_case_assignments ON case_assignments FOR ALL USING (app_is_psych());
DROP POLICY IF EXISTS p_appointments ON appointments;
CREATE POLICY p_appointments ON appointments FOR ALL USING (
  school_id = app_current_school() AND app_is_psych()
);
DROP POLICY IF EXISTS p_case_events ON case_events;
CREATE POLICY p_case_events ON case_events FOR ALL USING (
  school_id = app_current_school() AND app_is_psych()
);
DROP POLICY IF EXISTS p_clinical_notes ON clinical_notes;
CREATE POLICY p_clinical_notes ON clinical_notes FOR ALL USING (app_is_psych());
DROP POLICY IF EXISTS p_documents ON documents;
CREATE POLICY p_documents ON documents FOR ALL USING (
  school_id = app_current_school() AND app_is_psych()
);
DROP POLICY IF EXISTS p_guardians ON guardians;
CREATE POLICY p_guardians ON guardians FOR ALL USING (
  school_id = app_current_school() AND app_is_psych()
);
DROP POLICY IF EXISTS p_student_guardians ON student_guardians;
CREATE POLICY p_student_guardians ON student_guardians FOR ALL USING (app_is_psych());

-- ============ TAREFAS ============
-- Psicólogo: todas. Restantes: só as atribuídas a si.
DROP POLICY IF EXISTS p_tasks ON tasks;
CREATE POLICY p_tasks ON tasks FOR ALL USING (
  school_id = app_current_school() AND (
    app_is_psych() OR assignee_id = app_current_profile()
  )
);

-- ============ CONFIGURAÇÃO E ADMIN ============
-- Perfis: admin e psicólogo veem a escola; restantes só o próprio.
DROP POLICY IF EXISTS p_profiles ON profiles;
CREATE POLICY p_profiles ON profiles FOR ALL USING (
  school_id = app_current_school() AND (
    app_has_role('ADMINISTRATOR') OR app_is_psych() OR id = app_current_profile()
  )
);

-- Auditoria (leitura): administrador e psicólogo. Escrita só via app (audit()).
DROP POLICY IF EXISTS p_audit ON audit_events;
CREATE POLICY p_audit ON audit_events FOR SELECT USING (
  (school_id = app_current_school() OR school_id IS NULL)
  AND (app_has_role('ADMINISTRATOR') OR app_is_psych())
);
