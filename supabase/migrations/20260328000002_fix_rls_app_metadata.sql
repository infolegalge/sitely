-- ============================================
-- Migration: Fix RLS policies to use app_metadata instead of user_metadata
-- user_metadata is editable by the user via supabase.auth.updateUser()
-- app_metadata is only settable server-side (secure)
-- ============================================

-- Companies
DROP POLICY IF EXISTS "admin_all_companies" ON companies;
CREATE POLICY "admin_all_companies" ON companies
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Templates
DROP POLICY IF EXISTS "admin_all_templates" ON templates;
CREATE POLICY "admin_all_templates" ON templates
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Demos
DROP POLICY IF EXISTS "admin_all_demos" ON demos;
CREATE POLICY "admin_all_demos" ON demos
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Demo Events (admin read)
DROP POLICY IF EXISTS "admin_read_events" ON demo_events;
CREATE POLICY "admin_read_events" ON demo_events
  FOR SELECT USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- Email Campaigns
DROP POLICY IF EXISTS "admin_all_campaigns" ON email_campaigns;
CREATE POLICY "admin_all_campaigns" ON email_campaigns
  FOR ALL USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );

-- ============================================
-- ROLLBACK SQL (revert to user_metadata):
-- ============================================
-- DROP POLICY IF EXISTS "admin_all_companies" ON companies;
-- CREATE POLICY "admin_all_companies" ON companies FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');
-- DROP POLICY IF EXISTS "admin_all_templates" ON templates;
-- CREATE POLICY "admin_all_templates" ON templates FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');
-- DROP POLICY IF EXISTS "admin_all_demos" ON demos;
-- CREATE POLICY "admin_all_demos" ON demos FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');
-- DROP POLICY IF EXISTS "admin_read_events" ON demo_events;
-- CREATE POLICY "admin_read_events" ON demo_events FOR SELECT USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');
-- DROP POLICY IF EXISTS "admin_all_campaigns" ON email_campaigns;
-- CREATE POLICY "admin_all_campaigns" ON email_campaigns FOR ALL USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin');
