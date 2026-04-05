-- Make expires_at nullable to support permanent magic link tokens
ALTER TABLE onboard_tokens ALTER COLUMN expires_at DROP NOT NULL;
