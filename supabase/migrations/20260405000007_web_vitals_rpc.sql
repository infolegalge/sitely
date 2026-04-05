-- ═══════════════════════════════════════════════════════
-- Web Vitals aggregation RPC + materialized view refresh
-- ═══════════════════════════════════════════════════════

-- ── 1. Web Vitals breakdown (LCP, FID, CLS, TTFB) ──
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
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY (extra->>'value')::numeric), 2) AS p50,
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (extra->>'value')::numeric), 2) AS p75,
        ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY (extra->>'value')::numeric), 2) AS p95,
        ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY (extra->>'value')::numeric), 2) AS p99,
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

-- ── 2. Behavioral leaders with date filtering ──
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
        COALESCE(c.momentum_score, 0) AS momentum_score,
        COALESCE(c.alltime_score, 0) AS alltime_score,
        c.last_activity,
        COALESCE(cs.total_sessions, 0)::int AS total_sessions,
        COALESCE(cs.total_active_s, 0)::int AS total_active_s,
        COALESCE(cs.visited_main_site, false) AS visited_main_site,
        cs.top_section
      FROM companies c
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
      ORDER BY c.momentum_score DESC NULLS LAST
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
        COALESCE(c.momentum_score, 0) AS momentum_score,
        COALESCE(c.alltime_score, 0) AS alltime_score,
        c.last_activity,
        COUNT(DISTINCT de.session_id)::int AS total_sessions,
        COALESCE(MAX(CASE WHEN de.event_type = 'page_leave' THEN (de.extra->>'total_active_seconds')::int END), 0) AS total_active_s,
        BOOL_OR(de.is_main_site) AS visited_main_site,
        (ARRAY_AGG(de.section_name ORDER BY de.created_at DESC) FILTER (WHERE de.section_name IS NOT NULL))[1] AS top_section
      FROM companies c
      JOIN demos d ON d.company_id = c.id
      JOIN demo_events de ON de.demo_id = d.id
      WHERE c.status != 'archived'
        AND (p_tier IS NULL OR c.tier = p_tier)
        AND (p_from IS NULL OR de.created_at >= p_from)
        AND (p_to IS NULL OR de.created_at <= p_to)
      GROUP BY c.id
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
        COALESCE(c.momentum_score, 0) AS momentum_score,
        COALESCE(c.alltime_score, 0) AS alltime_score,
        c.last_activity,
        COUNT(DISTINCT de.session_id)::int AS total_sessions,
        COALESCE(MAX(CASE WHEN de.event_type = 'page_leave' THEN (de.extra->>'total_active_seconds')::int END), 0) AS total_active_s,
        BOOL_OR(de.is_main_site) AS visited_main_site,
        (ARRAY_AGG(de.section_name ORDER BY de.created_at DESC) FILTER (WHERE de.section_name IS NOT NULL))[1] AS top_section
      FROM companies c
      JOIN demos d ON d.company_id = c.id
      JOIN demo_events de ON de.demo_id = d.id
      WHERE c.status != 'archived'
        AND de.event_type = 'scroll_100'
        AND (p_tier IS NULL OR c.tier = p_tier)
        AND (p_from IS NULL OR de.created_at >= p_from)
        AND (p_to IS NULL OR de.created_at <= p_to)
      GROUP BY c.id
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
        COALESCE(c.momentum_score, 0) AS momentum_score,
        COALESCE(c.alltime_score, 0) AS alltime_score,
        c.last_activity,
        COUNT(DISTINCT de.session_id)::int AS total_sessions,
        COALESCE(MAX(CASE WHEN de.event_type = 'page_leave' THEN (de.extra->>'total_active_seconds')::int END), 0) AS total_active_s,
        true AS visited_main_site,
        (ARRAY_AGG(de.section_name ORDER BY de.created_at DESC) FILTER (WHERE de.section_name IS NOT NULL))[1] AS top_section
      FROM companies c
      JOIN demos d ON d.company_id = c.id
      JOIN demo_events de ON de.demo_id = d.id
      WHERE c.status != 'archived'
        AND de.is_main_site = true
        AND (p_tier IS NULL OR c.tier = p_tier)
        AND (p_from IS NULL OR de.created_at >= p_from)
        AND (p_to IS NULL OR de.created_at <= p_to)
      GROUP BY c.id
      ORDER BY total_sessions DESC
      LIMIT p_limit
    ) r;

  ELSE
    result := '[]'::json;
  END IF;

  RETURN result;
END;
$$;

-- ── 3. Active visitors (sessions in last N minutes) ──
CREATE OR REPLACE FUNCTION get_active_visitors(
  p_minutes INT DEFAULT 5
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'active_sessions', COUNT(DISTINCT session_id)::int,
      'active_demos', COUNT(DISTINCT demo_id)::int,
      'since', NOW() - (p_minutes || ' minutes')::interval
    )
    FROM demo_events
    WHERE created_at >= NOW() - (p_minutes || ' minutes')::interval
  );
END;
$$;

-- ── 4. Materialized view refresh function ──
CREATE OR REPLACE FUNCTION refresh_session_summaries()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_session_summaries;
END;
$$;
