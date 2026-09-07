-- Notificações: o utilizador só lê/edita as suas; a equipa SPO pode criar
-- notificações seguras para outros perfis da mesma escola.
DROP POLICY IF EXISTS p_notifications ON notifications;
DROP POLICY IF EXISTS p_notifications_select ON notifications;
DROP POLICY IF EXISTS p_notifications_insert ON notifications;
DROP POLICY IF EXISTS p_notifications_update ON notifications;

CREATE POLICY p_notifications_select ON notifications
  FOR SELECT USING (profile_id = app_current_profile());

CREATE POLICY p_notifications_insert ON notifications
  FOR INSERT WITH CHECK (
    app_has_role('SPO_PSYCHOLOGIST') OR app_has_role('ADMINISTRATOR')
  );

CREATE POLICY p_notifications_update ON notifications
  FOR UPDATE USING (profile_id = app_current_profile())
  WITH CHECK (profile_id = app_current_profile());
