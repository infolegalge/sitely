-- ============================================
-- Migration: Add snapshot_url for Storage-based HTML delivery
-- Dual-read strategy: try snapshot_url first, fallback to html_snapshot
-- ============================================

ALTER TABLE demos ADD COLUMN IF NOT EXISTS snapshot_url TEXT;

-- Create Storage bucket (run via Supabase Dashboard or CLI):
-- supabase storage create demo-snapshots --public

-- ============================================
-- ROLLBACK:
-- ALTER TABLE demos DROP COLUMN IF EXISTS snapshot_url;
-- ============================================
