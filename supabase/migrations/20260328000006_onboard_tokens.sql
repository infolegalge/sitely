-- Stage 7: Onboard tokens for anti-bot magic link flow
-- Token is sent via email, GET shows page but does NOT create session,
-- POST /api/auth/activate with token creates session (prevents bot scanners)

CREATE TABLE IF NOT EXISTS onboard_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for token lookup
CREATE INDEX idx_onboard_tokens_token ON onboard_tokens(token) WHERE used_at IS NULL;

-- Auto-cleanup: delete expired tokens older than 24 hours
-- (can be run by Inngest cron or manual cleanup)

-- RLS: service role only (no public access to tokens)
ALTER TABLE onboard_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on onboard_tokens"
  ON onboard_tokens
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
