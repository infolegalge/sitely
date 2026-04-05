-- ═══════════════════════════════════════════════════════
-- Missing indexes for analytics query performance
-- ═══════════════════════════════════════════════════════

-- Composite index for demos filtered by company + date (used in campaign/journey queries)
CREATE INDEX IF NOT EXISTS idx_demos_company_created
  ON demos (company_id, created_at DESC);

-- Composite index for event queries filtering by type + site origin + date
CREATE INDEX IF NOT EXISTS idx_events_type_mainsite_created
  ON demo_events (event_type, is_main_site, created_at DESC);

-- Index for geo breakdown queries
CREATE INDEX IF NOT EXISTS idx_events_country_created
  ON demo_events (ip_country, created_at DESC)
  WHERE ip_country IS NOT NULL;

-- Index for lead_notes pagination by company
CREATE INDEX IF NOT EXISTS idx_lead_notes_company_created
  ON lead_notes (company_id, created_at DESC);
