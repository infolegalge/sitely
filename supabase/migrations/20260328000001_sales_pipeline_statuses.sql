-- ============================================
-- Migration: Expand company statuses for sales pipeline
-- Also adds engagement_score and secure_link_id columns
-- ============================================

-- 1. Status expansion: old → new pipeline
-- Old: new, demo_generated, demo_sent, interested
-- New: lead, locked, demo_ready, contacted, engaged, converted, dnc

-- Migrate existing statuses to new names
UPDATE companies SET status = 'lead' WHERE status = 'new';
UPDATE companies SET status = 'demo_ready' WHERE status = 'demo_generated';
UPDATE companies SET status = 'contacted' WHERE status = 'demo_sent';
UPDATE companies SET status = 'engaged' WHERE status = 'interested';

-- 2. Add new columns
ALTER TABLE companies ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS secure_link_id UUID DEFAULT gen_random_uuid() UNIQUE;

-- 3. Composite index for CMS filtering
CREATE INDEX IF NOT EXISTS idx_companies_status_category 
  ON companies(status, category);
CREATE INDEX IF NOT EXISTS idx_companies_engagement 
  ON companies(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_demos_expires 
  ON demos(expires_at);

-- ============================================
-- ROLLBACK SQL (run manually if needed):
-- ============================================
-- UPDATE companies SET status = 'new' WHERE status = 'lead';
-- UPDATE companies SET status = 'demo_generated' WHERE status IN ('locked', 'demo_ready');
-- UPDATE companies SET status = 'demo_sent' WHERE status = 'contacted';
-- UPDATE companies SET status = 'interested' WHERE status IN ('engaged', 'converted');
-- DELETE FROM companies WHERE status = 'dnc';
-- ALTER TABLE companies DROP COLUMN IF EXISTS engagement_score;
-- ALTER TABLE companies DROP COLUMN IF EXISTS secure_link_id;
-- DROP INDEX IF EXISTS idx_companies_status_category;
-- DROP INDEX IF EXISTS idx_companies_engagement;
-- DROP INDEX IF EXISTS idx_demos_expires;
