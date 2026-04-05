-- ═══════════════════════════════════════════════════════
-- Fix 3 RPC errors:
--   1. get_behavioral_leaders: c.momentum_score → join company_lead_scores view
--   2. get_web_vitals_breakdown: ROUND(double precision, int) → cast ::numeric
--   3. get_session_percentiles: same ROUND fix
-- ═══════════════════════════════════════════════════════

-- ── 1. get_behavioral_leaders ────────────────────────────────
-- The previous version referenced c.momentum_score on the companies table,
-- but momentum_score/alltime_score/last_activity live in the company_lead_scores VIEW.
CREATE OR REPLACE FUNCTION get_behavioral_leaders(
  p_behavior TEXT,
  p_limit    INT  DEFAULT 10,
  p_tier     INT  DEFAULT NULL,
  p_from     TIMESTAMPTZ DEFAULT NULL,
  p_to       TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  IF p_behavior = 'momentum' THEN
    SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO result
    FROM (
      SELECT
        c.id AS company_id,
        c.name,
        c.category,
        c.tier,
        c.email,
        c.phone,
        c.sales_status,
        c.is_favorite,
        COALESCE(cls.momentum_score, 0) AS momentum_score,
        COALESCE(cls.alltime_score, 0) AS alltime_score,
        cls.last_activity,
        COALESCE(cs.total_sessions, 0)::int AS total_sessions,
        COALESCE(cs.total_active_s, 0)::int AS total_active_s,
        COALESCE(cs.visited_main_site, false) AS visited_main_site,
        cs.top_section
      FROM companies c
      LEFT JOIN company_lead_scores cls ON cls.company_id = c.id
      LEFT JOIN LATERAL (
        SELECT
          COUNT(DISTINCT de.session_id)::int AS total_sessions,
          COALESCE(MAX(CASE WHEN de.event_type = 'page_leave' THEN (de.extra->>'total_active_seconds')::int END), 0) AS total_active_s,
          BOOL_OR(de.is_main_site) AS visited_main_site,
          (ARRAY_AGG(de.section_name ORDER BY de.created_at DESC) FILTER (WHERE de.section_name IS NOT NULL))[1] AS top_section
        FROM demo_events de
        JOIN demos d ON d.id = de.demo_id
        WHERE d.company_id = c.id
          AND (p_from IS NULL OR de.created_at >= p_from)
          AND (p_to IS NULL OR de.created_at <= p_to)
      ) cs ON true
      WHERE c.status != 'archived'
        AND (p_tier IS NULL OR c.tier = p_tier)
        AND (cs.total_sessions > 0 OR p_from IS NULL)
      ORDER BY cls.momentum_score DESC NULLS LAST
      LIMIT p_limit
    ) r;

  ELSIF p_behavior = 'time' THEN
    SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO result
    FROM (
      SELECT
        c.id AS company_id,
        c.name,
        c.category,
        c.tier,
        c.email,
        c.phone,
        c.sales_status,
        c.is_favorite,
        COALESCE(cls.momentum_score, 0) AS momentum_score,
        COALESCE(cls.alltime_score, 0) AS alltime_score,
        cls.last_activity,
        COUNT(DISTINCT de.session_id)::int AS total_sessions,
        COALESCE(MAX(CASE WHEN de.event_type = 'page_leave' THEN (de.extra->>'total_active_seconds')::int END), 0) AS total_active_s,
        BOOL_OR(de.is_main_site) AS visited_main_site,
        (ARRAY_AGG(de.section_name ORDER BY de.created_at DESC) FILTER (WHERE de.section_name IS NOT NULL))[1] AS top_section
      FROM companies c
      LEFT JOIN company_lead_scores cls ON cls.company_id = c.id
      JOIN demos d ON d.company_id = c.id
      JOIN demo_events de ON de.demo_id = d.id
      WHERE c.status != 'archived'
        AND (p_tier IS NULL OR c.tier = p_tier)
        AND (p_from IS NULL OR de.created_at >= p_from)
        AND (p_to IS NULL OR de.created_at <= p_to)
      GROUP BY c.id, c.name, c.category, c.tier, c.email, c.phone,
               c.sales_status, c.is_favorite,
               cls.momentum_score, cls.alltime_score, cls.last_activity
      ORDER BY total_active_s DESC
      LIMIT p_limit
    ) r;

  ELSIF p_behavior = 'scroll' THEN
    SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO result
    FROM (
      SELECT
        c.id AS company_id,
        c.name,
        c.category,
        c.tier,
        c.email,
        c.phone,
        c.sales_status,
        c.is_favorite,
        COALESCE(cls.momentum_score, 0) AS momentum_score,
        COALESCE(cls.alltime_score, 0) AS alltime_score,
        cls.last_activity,
        COUNT(DISTINCT de.session_id)::int AS total_sessions,
        COALESCE(MAX(CASE WHEN de.event_type = 'page_leave' THEN (de.extra->>'total_active_seconds')::int END), 0) AS total_active_s,
        BOOL_OR(de.is_main_site) AS visited_main_site,
        (ARRAY_AGG(de.section_name ORDER BY de.created_at DESC) FILTER (WHERE de.section_name IS NOT NULL))[1] AS top_section
      FROM companies c
      LEFT JOIN company_lead_scores cls ON cls.company_id = c.id
      JOIN demos d ON d.company_id = c.id
      JOIN demo_events de ON de.demo_id = d.id
      WHERE c.status != 'archived'
        AND de.event_type = 'scroll_100'
        AND (p_tier IS NULL OR c.tier = p_tier)
        AND (p_from IS NULL OR de.created_at >= p_from)
        AND (p_to IS NULL OR de.created_at <= p_to)
      GROUP BY c.id, c.name, c.category, c.tier, c.email, c.phone,
               c.sales_status, c.is_favorite,
               cls.momentum_score, cls.alltime_score, cls.last_activity
      ORDER BY total_sessions DESC
      LIMIT p_limit
    ) r;

  ELSIF p_behavior = 'cross_domain' THEN
    SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json) INTO result
    FROM (
      SELECT
        c.id AS company_id,
        c.name,
        c.category,
        c.tier,
        c.email,
        c.phone,
        c.sales_status,
        c.is_favorite,
        COALESCE(cls.momentum_score, 0) AS momentum_score,
        COALESCE(cls.alltime_score, 0) AS alltime_score,
        cls.last_activity,
        COUNT(DISTINCT de.session_id)::int AS total_sessions,
        COALESCE(MAX(CASE WHEN de.event_type = 'page_leave' THEN (de.extra->>'total_active_seconds')::int END), 0) AS total_active_s,
        true AS visited_main_site,
        (ARRAY_AGG(de.section_name ORDER BY de.created_at DESC) FILTER (WHERE de.section_name IS NOT NULL))[1] AS top_section
      FROM companies c
      LEFT JOIN company_lead_scores cls ON cls.company_id = c.id
      JOIN demos d ON d.company_id = c.id
      JOIN demo_events de ON de.demo_id = d.id
      WHERE c.status != 'archived'
        AND de.is_main_site = true
        AND (p_tier IS NULL OR c.tier = p_tier)
        AND (p_from IS NULL OR de.created_at >= p_from)
        AND (p_to IS NULL OR de.created_at <= p_to)
      GROUP BY c.id, c.name, c.category, c.tier, c.email, c.phone,
               c.sales_status, c.is_favorite,
               cls.momentum_score, cls.alltime_score, cls.last_activity
      ORDER BY total_sessions DESC
      LIMIT p_limit
    ) r;

  ELSE
    result := '[]'::json;
  END IF;

  RETURN result;
END;
$$;


-- ── 2. get_web_vitals_breakdown ──────────────────────────────
-- Fix: PERCENTILE_CONT returns double precision; ROUND(dp, int) doesn't exist.
-- Cast to ::numeric before rounding.
CREATE OR REPLACE FUNCTION get_web_vitals_breakdown(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(v)), '[]'::json)
    FROM (
      SELECT
        extra->>'metric' AS metric,
        COUNT(*)::int AS samples,
        ROUND(AVG((extra->>'value')::numeric), 2) AS avg_value,
        ROUND((PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY (extra->>'value')::numeric))::numeric, 2) AS p50,
        ROUND((PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (extra->>'value')::numeric))::numeric, 2) AS p75,
        ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (extra->>'value')::numeric))::numeric, 2) AS p95,
        ROUND((PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (extra->>'value')::numeric))::numeric, 2) AS p99,
        MIN((extra->>'value')::numeric) AS min_value,
        MAX((extra->>'value')::numeric) AS max_value,
        extra->>'unit' AS unit
      FROM demo_events
      WHERE event_type = 'web_vital'
        AND extra->>'metric' IS NOT NULL
        AND extra->>'value' IS NOT NULL
        AND (p_from IS NULL OR created_at >= p_from)
        AND (p_to IS NULL OR created_at <= p_to)
      GROUP BY extra->>'metric', extra->>'unit'
      ORDER BY metric
    ) v
  );
END;
$$;


-- ── 3. get_session_percentiles ───────────────────────────────
-- Fix: same ROUND(double precision, int) issue on PERCENTILE_CONT results.
CREATE OR REPLACE FUNCTION get_session_percentiles(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_from TIMESTAMPTZ := COALESCE(p_from, '2000-01-01'::timestamptz);
  v_to   TIMESTAMPTZ := COALESCE(p_to, NOW() + INTERVAL '1 day');
BEGIN
  RETURN (
    SELECT json_build_object(
      'total_sessions', COUNT(*)::int,
      'avg_s',  ROUND(AVG(session_duration_ms)::numeric / 1000, 1),
      'p10_s',  ROUND((PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0)::numeric, 1),
      'p25_s',  ROUND((PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0)::numeric, 1),
      'p50_s',  ROUND((PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0)::numeric, 1),
      'p75_s',  ROUND((PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0)::numeric, 1),
      'p90_s',  ROUND((PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0)::numeric, 1),
      'p95_s',  ROUND((PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0)::numeric, 1),
      'p99_s',  ROUND((PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0)::numeric, 1),
      'min_s',  ROUND(MIN(session_duration_ms)::numeric / 1000, 1),
      'max_s',  ROUND(MAX(session_duration_ms)::numeric / 1000, 1),
      'buckets', (
        SELECT COALESCE(json_agg(row_to_json(b) ORDER BY b.bucket_start), '[]'::json)
        FROM (
          SELECT
            CASE
              WHEN session_duration_ms < 5000    THEN 0
              WHEN session_duration_ms < 15000   THEN 5
              WHEN session_duration_ms < 30000   THEN 15
              WHEN session_duration_ms < 60000   THEN 30
              WHEN session_duration_ms < 120000  THEN 60
              WHEN session_duration_ms < 300000  THEN 120
              ELSE 300
            END AS bucket_start,
            CASE
              WHEN session_duration_ms < 5000    THEN '0-5s'
              WHEN session_duration_ms < 15000   THEN '5-15s'
              WHEN session_duration_ms < 30000   THEN '15-30s'
              WHEN session_duration_ms < 60000   THEN '30s-1m'
              WHEN session_duration_ms < 120000  THEN '1-2m'
              WHEN session_duration_ms < 300000  THEN '2-5m'
              ELSE '5m+'
            END AS label,
            COUNT(*)::int AS count
          FROM mv_session_summaries
          WHERE session_duration_ms IS NOT NULL
            AND started_at >= v_from AND started_at < v_to
          GROUP BY bucket_start, label
        ) b
      )
    )
    FROM mv_session_summaries
    WHERE session_duration_ms IS NOT NULL
      AND started_at >= v_from AND started_at < v_to
  );
END;
$$;
