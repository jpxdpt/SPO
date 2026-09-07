-- A psicóloga SPO pode criar utilizadores e atribuir papéis do sistema.
DROP POLICY IF EXISTS p_user_roles_insert ON user_roles;
CREATE POLICY p_user_roles_insert ON user_roles
  FOR INSERT WITH CHECK (app_has_role('SPO_PSYCHOLOGIST') OR app_has_role('ADMINISTRATOR'));

DROP POLICY IF EXISTS p_roles_insert ON roles;
CREATE POLICY p_roles_insert ON roles
  FOR INSERT WITH CHECK (school_id = app_current_school() AND (app_has_role('SPO_PSYCHOLOGIST') OR app_has_role('ADMINISTRATOR')));

DROP POLICY IF EXISTS p_profiles_insert ON profiles;
CREATE POLICY p_profiles_insert ON profiles
  FOR INSERT WITH CHECK (school_id = app_current_school() AND (app_has_role('SPO_PSYCHOLOGIST') OR app_has_role('ADMINISTRATOR')));
