-- Fix: Replace partial unique index with full unique index.
-- PostgreSQL ON CONFLICT cannot match partial indexes without WHERE predicate.
-- PostgreSQL allows multiple NULLs in unique indexes by default, so this is safe.

DROP INDEX IF EXISTS idx_events_idempotency;

CREATE UNIQUE INDEX IF NOT EXISTS idx_events_idempotency
ON demo_events (idempotency_key);
