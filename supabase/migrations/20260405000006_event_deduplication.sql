-- Migration: Event deduplication via idempotency key
-- Adds idempotency_key column to demo_events for duplicate prevention

-- Add idempotency_key column (nullable for backward compat with existing rows)
ALTER TABLE demo_events
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Unique partial index: only enforce uniqueness on non-null keys
CREATE UNIQUE INDEX IF NOT EXISTS idx_events_idempotency
ON demo_events (idempotency_key)
WHERE idempotency_key IS NOT NULL;
