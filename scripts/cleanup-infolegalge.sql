BEGIN;

DELETE FROM demo_events WHERE demo_id IN (SELECT id FROM demos WHERE company_id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7');
DELETE FROM project_files WHERE project_id IN (SELECT id FROM projects WHERE company_id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7');
DELETE FROM messages WHERE project_id IN (SELECT id FROM projects WHERE company_id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7');
DELETE FROM proposals WHERE project_id IN (SELECT id FROM projects WHERE company_id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7');
DELETE FROM project_timeline_steps WHERE project_id IN (SELECT id FROM projects WHERE company_id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7');
DELETE FROM onboard_tokens WHERE email = 'infolegalge@gmail.com';
DELETE FROM projects WHERE company_id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7';
DELETE FROM demos WHERE company_id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7';
DELETE FROM lead_notes WHERE company_id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7';
DELETE FROM dead_letter_queue WHERE email = 'infolegalge@gmail.com';
UPDATE companies SET sales_status = 'none', engagement_score = 0, last_contacted_at = NULL, secure_link_id = NULL, next_followup_at = NULL, status = 'new', notes = NULL, metadata = '{}'::jsonb, updated_at = now() WHERE id = '7de2bd01-eb00-4ee5-9ad7-47a25f6a48f7';
DELETE FROM auth.users WHERE id = '5554264d-b5c6-48a8-a865-b58b51f2b7f5';

COMMIT;
