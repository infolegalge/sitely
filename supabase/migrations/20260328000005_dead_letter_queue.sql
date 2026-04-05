-- Migration: dead_letter_queue table + increment_campaign_count RPC

-- Dead letter queue for failed emails (debugging)
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  demo_id TEXT,
  bounce_type TEXT NOT NULL CHECK (bounce_type IN ('soft', 'hard')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: only service role can access DLQ
ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only on dead_letter_queue"
  ON dead_letter_queue
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add total_recipients column to email_campaigns if missing
ALTER TABLE email_campaigns ADD COLUMN IF NOT EXISTS total_recipients INTEGER NOT NULL DEFAULT 0;

-- Increment campaign count RPC (called from Inngest steps)
CREATE OR REPLACE FUNCTION increment_campaign_count(p_campaign_id UUID, p_increment INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE email_campaigns
  SET sent_count = COALESCE(sent_count, 0) + p_increment
  WHERE id = p_campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rollback:
-- DROP FUNCTION IF EXISTS increment_campaign_count(UUID, INTEGER);
-- DROP TABLE IF EXISTS dead_letter_queue;
-- ALTER TABLE email_campaigns DROP COLUMN IF EXISTS total_recipients;
