-- ============================================================
-- Sales Intelligence & Behavioral Tracking Extension
-- Phase 1: Schema expansion for CRM pipeline + behavioral data
-- ============================================================


-- ── 1. CRM columns on companies ──────────────────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS sales_status   TEXT NOT NULL DEFAULT 'uncontacted',
  ADD COLUMN IF NOT EXISTS is_favorite    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_followup_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_companies_sales_status
  ON companies (sales_status);
CREATE INDEX IF NOT EXISTS idx_companies_favorite
  ON companies (is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_companies_followup
  ON companies (next_followup_at) WHERE next_followup_at IS NOT NULL;


-- ── 2. Expand demo_events for section / cross-domain tracking ─
ALTER TABLE demo_events
  ADD COLUMN IF NOT EXISTS section_name    TEXT,
  ADD COLUMN IF NOT EXISTS is_main_site    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS interaction_type TEXT;

CREATE INDEX IF NOT EXISTS idx_events_section
  ON demo_events (section_name) WHERE section_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_main_site
  ON demo_events (is_main_site) WHERE is_main_site = true;


-- ── 3. Lead notes (sales call log / comments) ────────────────
CREATE TABLE IF NOT EXISTS lead_notes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  author      TEXT NOT NULL DEFAULT 'admin',
  body        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_notes_company
  ON lead_notes (company_id, created_at DESC);

ALTER TABLE lead_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_notes" ON lead_notes;
CREATE POLICY "service_role_all_notes" ON lead_notes
  FOR ALL USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "admin_all_notes" ON lead_notes;
CREATE POLICY "admin_all_notes" ON lead_notes
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );


-- ── 4. Momentum Score view (decay-aware) ─────────────────────
-- Instead of a cron job, we use a SQL view that computes
-- "current momentum" on-the-fly using exponential decay.
-- Formula: each event's weight decays by 50% every 7 days.
-- Recent events matter more; stale leads naturally cool off.
--
-- The view produces one row per company with:
--   momentum_score  — decay-weighted total (hot right now)
--   alltime_score   — sum without decay (historical value)
--   last_activity   — most recent event timestamp
--   total_sessions  — distinct session count
--   total_active_s  — total active time in seconds (from page_leave events)
--   top_section     — section with most dwell time
-- ──────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW company_lead_scores AS
WITH event_weights AS (
  SELECT
    d.company_id,
    de.session_id,
    de.created_at          AS event_at,
    de.event_type,
    de.section_name,
    de.is_main_site,
    de.interaction_type,
    de.extra,
    -- Raw score per event type
    CASE de.event_type
      WHEN 'page_open'       THEN 1
      WHEN 'scroll_25'       THEN 1
      WHEN 'scroll_50'       THEN 2
      WHEN 'scroll_75'       THEN 3
      WHEN 'scroll_100'      THEN 5
      WHEN 'active_time_10s' THEN 1
      WHEN 'active_time_30s' THEN 2
      WHEN 'active_time_60s' THEN 4
      WHEN 'active_time_180s' THEN 8
      WHEN 'active_time_300s' THEN 12
      WHEN 'click_phone'     THEN 15
      WHEN 'click_email'     THEN 15
      WHEN 'click_cta'       THEN 20
      WHEN 'click_sitely'    THEN 10
      WHEN 'form_submit'     THEN 50
      WHEN 'section_view'    THEN 2
      WHEN 'interaction_3d'  THEN 5
      ELSE 0
    END AS raw_weight,
    -- Decay factor: 50% drop every 7 days
    -- exp(ln(0.5) * age_days / 7) = 0.5^(age_days/7)
    EXP(LN(0.5) * EXTRACT(EPOCH FROM (now() - de.created_at)) / (7 * 86400))
      AS decay_factor
  FROM demo_events de
  JOIN demos d ON d.id = de.demo_id
),
scored AS (
  SELECT
    company_id,
    ROUND(SUM(raw_weight * decay_factor))::INT AS momentum_score,
    SUM(raw_weight)::INT                       AS alltime_score,
    MAX(event_at)                               AS last_activity,
    COUNT(DISTINCT session_id)                  AS total_sessions,
    BOOL_OR(is_main_site)                       AS visited_main_site
  FROM event_weights
  GROUP BY company_id
),
active_time AS (
  SELECT
    d.company_id,
    SUM(COALESCE((de.extra->>'total_active_seconds')::INT, 0)) AS total_active_s
  FROM demo_events de
  JOIN demos d ON d.id = de.demo_id
  WHERE de.event_type = 'page_leave'
  GROUP BY d.company_id
),
top_sections AS (
  SELECT DISTINCT ON (company_id)
    d.company_id,
    de.section_name,
    SUM(COALESCE((de.extra->>'duration_s')::INT, 0)) AS section_time_s
  FROM demo_events de
  JOIN demos d ON d.id = de.demo_id
  WHERE de.event_type = 'section_view' AND de.section_name IS NOT NULL
  GROUP BY d.company_id, de.section_name
  ORDER BY d.company_id, section_time_s DESC
)
SELECT
  s.company_id,
  s.momentum_score,
  s.alltime_score,
  s.last_activity,
  s.total_sessions,
  s.visited_main_site,
  COALESCE(at.total_active_s, 0)  AS total_active_s,
  ts.section_name                  AS top_section
FROM scored s
LEFT JOIN active_time at ON at.company_id = s.company_id
LEFT JOIN top_sections ts ON ts.company_id = s.company_id;


-- ── 5. RPC: get_behavioral_leaders ───────────────────────────
-- Returns top N companies by a specific behavior metric.
-- behavior = 'time' | 'scroll' | 'cross_domain' | 'momentum'
CREATE OR REPLACE FUNCTION get_behavioral_leaders(
  p_behavior TEXT DEFAULT 'momentum',
  p_limit    INT  DEFAULT 10,
  p_tier     INT  DEFAULT NULL
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    WITH base AS (
      SELECT
        cls.company_id,
        c.name,
        c.category,
        c.tier,
        c.email,
        c.phone,
        c.sales_status,
        c.is_favorite,
        cls.momentum_score,
        cls.alltime_score,
        cls.last_activity,
        cls.total_sessions,
        cls.total_active_s,
        cls.visited_main_site,
        cls.top_section
      FROM company_lead_scores cls
      JOIN companies c ON c.id = cls.company_id
      WHERE (p_tier IS NULL OR c.tier = p_tier)
    )
    SELECT COALESCE(json_agg(row_to_json(b)), '[]'::JSON)
    FROM (
      SELECT * FROM base
      ORDER BY
        CASE p_behavior
          WHEN 'time'         THEN total_active_s
          WHEN 'scroll'       THEN alltime_score
          WHEN 'cross_domain' THEN CASE WHEN visited_main_site THEN 1 ELSE 0 END
          ELSE momentum_score
        END DESC,
        last_activity DESC NULLS LAST
      LIMIT p_limit
    ) b
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 6. RPC: get_lead_journey ─────────────────────────────────
-- Returns the full chronological timeline for a single company.
CREATE OR REPLACE FUNCTION get_lead_journey(p_company_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(e) ORDER BY e.created_at), '[]'::JSON)
    FROM (
      SELECT
        de.event_type,
        de.section_name,
        de.is_main_site,
        de.interaction_type,
        de.page_url,
        de.user_agent,
        de.session_id,
        de.duration_ms,
        de.scroll_depth,
        de.extra,
        de.created_at
      FROM demo_events de
      JOIN demos d ON d.id = de.demo_id
      WHERE d.company_id = p_company_id
      ORDER BY de.created_at
    ) e
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 7. RPC: get_lead_notes ───────────────────────────────────
CREATE OR REPLACE FUNCTION get_lead_notes(p_company_id UUID)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(n) ORDER BY n.created_at DESC), '[]'::JSON)
    FROM (
      SELECT id, body, author, created_at
      FROM lead_notes
      WHERE company_id = p_company_id
      ORDER BY created_at DESC
    ) n
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 8. RPC: update_sales_status ──────────────────────────────
CREATE OR REPLACE FUNCTION update_sales_status(
  p_company_id   UUID,
  p_sales_status TEXT,
  p_next_followup TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE companies
  SET
    sales_status     = p_sales_status,
    next_followup_at = p_next_followup,
    updated_at       = now()
  WHERE id = p_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 9. RPC: toggle_favorite ──────────────────────────────────
CREATE OR REPLACE FUNCTION toggle_favorite(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_new BOOLEAN;
BEGIN
  UPDATE companies
  SET is_favorite = NOT is_favorite, updated_at = now()
  WHERE id = p_company_id
  RETURNING is_favorite INTO v_new;
  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- ROLLBACK:
-- DROP VIEW  IF EXISTS company_lead_scores;
-- DROP FUNCTION IF EXISTS get_behavioral_leaders(TEXT, INT, INT);
-- DROP FUNCTION IF EXISTS get_lead_journey(UUID);
-- DROP FUNCTION IF EXISTS get_lead_notes(UUID);
-- DROP FUNCTION IF EXISTS update_sales_status(UUID, TEXT, TIMESTAMPTZ);
-- DROP FUNCTION IF EXISTS toggle_favorite(UUID);
-- DROP TABLE IF EXISTS lead_notes;
-- ALTER TABLE companies DROP COLUMN IF EXISTS sales_status,
--   DROP COLUMN IF EXISTS is_favorite, DROP COLUMN IF EXISTS next_followup_at;
-- ALTER TABLE demo_events DROP COLUMN IF EXISTS section_name,
--   DROP COLUMN IF EXISTS is_main_site, DROP COLUMN IF EXISTS interaction_type;
-- ============================================================
