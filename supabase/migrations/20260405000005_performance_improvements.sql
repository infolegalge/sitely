-- ═══════════════════════════════════════════════════════
-- Performance: Campaign stats RPC (eliminates N+1),
-- lead_notes pagination, session summaries materialized view
-- ═══════════════════════════════════════════════════════

-- ── 1. Campaign stats aggregation (replaces N+1 query) ──
CREATE OR REPLACE FUNCTION get_campaign_stats(p_campaign_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    WITH demo_stats AS (
      SELECT
        COUNT(*)::int AS sent,
        COUNT(*) FILTER (WHERE view_count > 0)::int AS viewed
      FROM demos
      WHERE campaign_id = p_campaign_id
    ),
    event_agg AS (
      SELECT
        e.event_type,
        COUNT(*)::int AS cnt
      FROM demo_events e
      JOIN demos d ON d.id = e.demo_id
      WHERE d.campaign_id = p_campaign_id
      GROUP BY e.event_type
    ),
    event_counts AS (
      SELECT COALESCE(json_object_agg(event_type, cnt), '{}'::json) AS counts
      FROM event_agg
    )
    SELECT json_build_object(
      'stats', json_build_object(
        'sent', (SELECT sent FROM demo_stats),
        'viewed', (SELECT viewed FROM demo_stats),
        'scrollComplete', COALESCE((SELECT cnt FROM event_agg WHERE event_type = 'scroll_100'), 0),
        'ctaClicks', COALESCE((SELECT SUM(cnt) FROM event_agg WHERE event_type IN ('click_cta','click_phone','click_email')), 0)::int,
        'formSubmits', COALESCE((SELECT cnt FROM event_agg WHERE event_type = 'form_submit'), 0)
      ),
      'eventCounts', (SELECT counts FROM event_counts)
    )
  );
END;
$$;

-- ── 2. lead_notes with pagination ──
CREATE OR REPLACE FUNCTION get_lead_notes(
  p_company_id UUID,
  p_limit   INT DEFAULT 100,
  p_offset  INT DEFAULT 0
)
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(n) ORDER BY n.created_at DESC), '[]'::JSON)
    FROM (
      SELECT id, body, author, created_at
      FROM lead_notes
      WHERE company_id = p_company_id
      ORDER BY created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) n
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. Session summaries materialized view ──
-- Pre-aggregates raw events into per-session summaries for fast KPI queries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_session_summaries AS
SELECT
  session_id,
  (ARRAY_AGG(demo_id ORDER BY created_at ASC))[1] AS demo_id,
  MIN(created_at) AS started_at,
  MAX(created_at) AS ended_at,
  COUNT(*)::int AS event_count,
  BOOL_OR(event_type = 'page_open') AS saw_page,
  BOOL_OR(event_type IN ('scroll_25','scroll_50','scroll_75','scroll_100')) AS scrolled_any,
  BOOL_OR(event_type = 'scroll_100') AS scrolled_full,
  BOOL_OR(event_type IN ('click_cta','click_phone','click_email')) AS clicked_cta,
  BOOL_OR(event_type = 'form_start') AS started_form,
  BOOL_OR(event_type = 'form_submit') AS submitted_form,
  BOOL_OR(event_type = 'form_abandon') AS abandoned_form,
  BOOL_OR(event_type = 'click_sitely') AS visited_main_site,
  MAX(CASE WHEN event_type = 'page_leave' THEN duration_ms ELSE NULL END) AS session_duration_ms,
  MAX(scroll_depth) AS max_scroll_depth,
  (ARRAY_AGG(ip_country ORDER BY created_at ASC) FILTER (WHERE ip_country IS NOT NULL))[1] AS ip_country,
  BOOL_OR(is_main_site) AS is_main_site
FROM demo_events
WHERE session_id IS NOT NULL
GROUP BY session_id;

-- Unique index on session_id for REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_session_summaries_session
  ON mv_session_summaries (session_id);

CREATE INDEX IF NOT EXISTS idx_mv_session_summaries_started
  ON mv_session_summaries (started_at DESC);

CREATE INDEX IF NOT EXISTS idx_mv_session_summaries_demo
  ON mv_session_summaries (demo_id);

-- Initial refresh
REFRESH MATERIALIZED VIEW mv_session_summaries;

-- ── 4. Index on email_campaigns for campaign_id joins ──
CREATE INDEX IF NOT EXISTS idx_demos_campaign_id_created
  ON demos (campaign_id, created_at DESC);
