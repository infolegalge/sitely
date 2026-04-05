-- Migration: increment_engagement_score RPC function
-- Increments engagement_score on the company linked to a demo

CREATE OR REPLACE FUNCTION increment_engagement_score(p_demo_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE companies
  SET engagement_score = COALESCE(engagement_score, 0) + 1
  WHERE id = (
    SELECT company_id FROM demos WHERE id = p_demo_id::INT LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rollback:
-- DROP FUNCTION IF EXISTS increment_engagement_score(TEXT);
