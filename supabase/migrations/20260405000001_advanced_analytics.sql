-- ═══════════════════════════════════════════════════════
-- Advanced Analytics: Date Filtering, Time Series, Heatmap, KPIs
-- ═══════════════════════════════════════════════════════

-- ── 1. Drop old parameterless overview to replace with date-range version ──
DROP FUNCTION IF EXISTS get_analytics_overview();

-- ── 2. Recreate overview with date-range + KPI support ──
CREATE OR REPLACE FUNCTION get_analytics_overview(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_from TIMESTAMPTZ := COALESCE(p_from, '2000-01-01'::timestamptz);
  v_to   TIMESTAMPTZ := COALESCE(p_to, NOW() + INTERVAL '1 day');
  result JSON;
BEGIN
  SELECT json_build_object(
    'funnel', json_build_object(
      'sent',      (SELECT COUNT(*)::int FROM demos
                    WHERE created_at >= v_from AND created_at < v_to),
      'viewed',    (SELECT COUNT(*)::int FROM demos
                    WHERE first_viewed_at IS NOT NULL
                      AND first_viewed_at >= v_from AND first_viewed_at < v_to),
      'scrolled',  (SELECT COUNT(DISTINCT demo_id)::int FROM demo_events
                    WHERE event_type = 'scroll_100'
                      AND created_at >= v_from AND created_at < v_to),
      'cta',       (SELECT COUNT(DISTINCT demo_id)::int FROM demo_events
                    WHERE event_type IN ('click_cta','click_phone','click_email')
                      AND created_at >= v_from AND created_at < v_to),
      'converted', (SELECT COUNT(DISTINCT demo_id)::int FROM demo_events
                    WHERE event_type = 'form_submit'
                      AND created_at >= v_from AND created_at < v_to)
    ),
    'eventCounts', (
      SELECT COALESCE(json_object_agg(et, cnt), '{}'::json)
      FROM (
        SELECT event_type AS et, COUNT(*)::int AS cnt
        FROM demo_events
        WHERE created_at >= v_from AND created_at < v_to
        GROUP BY event_type
      ) sub
    ),
    'kpi', json_build_object(
      'totalViews',       (SELECT COUNT(*)::int FROM demo_events
                           WHERE event_type = 'page_open'
                             AND created_at >= v_from AND created_at < v_to),
      'activeLeads',      (SELECT COUNT(DISTINCT d.company_id)::int
                           FROM demos d
                           JOIN demo_events de ON de.demo_id = d.id
                           WHERE de.created_at >= v_from AND de.created_at < v_to),
      'avgSessionSeconds', ROUND(COALESCE(
                             (SELECT AVG(duration_ms)::numeric / 1000
                              FROM demo_events
                              WHERE event_type = 'page_leave'
                                AND duration_ms IS NOT NULL
                                AND created_at >= v_from AND created_at < v_to),
                             0), 1),
      'totalSessions',    (SELECT COUNT(DISTINCT session_id)::int
                           FROM demo_events
                           WHERE created_at >= v_from AND created_at < v_to)
    )
  ) INTO result;
  RETURN result;
END;
$$;

-- ── 3. Daily event time series ──
CREATE OR REPLACE FUNCTION get_daily_event_stats(
  p_from TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
    FROM (
      SELECT
        TO_CHAR(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        COUNT(*) FILTER (WHERE event_type = 'page_open')::int AS page_open,
        COUNT(*) FILTER (WHERE event_type = 'page_leave')::int AS page_leave,
        COUNT(*) FILTER (WHERE event_type IN ('scroll_25','scroll_50','scroll_75','scroll_100'))::int AS scrolls,
        COUNT(*) FILTER (WHERE event_type = 'scroll_100')::int AS scroll_complete,
        COUNT(*) FILTER (WHERE event_type IN ('click_cta','click_phone','click_email'))::int AS clicks,
        COUNT(*) FILTER (WHERE event_type = 'click_cta')::int AS cta_clicks,
        COUNT(*) FILTER (WHERE event_type = 'form_submit')::int AS form_submit,
        COUNT(*) FILTER (WHERE event_type = 'section_view')::int AS section_view,
        COUNT(*) FILTER (WHERE event_type = 'interaction_3d')::int AS interaction_3d,
        COUNT(DISTINCT session_id)::int AS unique_sessions,
        COUNT(*)::int AS total
      FROM demo_events
      WHERE created_at >= p_from AND created_at < p_to
      GROUP BY date_trunc('day', created_at)
      ORDER BY date_trunc('day', created_at)
    ) sub
  );
END;
$$;

-- ── 4. Activity heatmap: hour × day_of_week ──
CREATE OR REPLACE FUNCTION get_activity_heatmap(
  p_from TIMESTAMPTZ DEFAULT (NOW() - INTERVAL '30 days'),
  p_to   TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
    FROM (
      SELECT
        EXTRACT(DOW FROM created_at)::int AS day,
        EXTRACT(HOUR FROM created_at)::int AS hour,
        COUNT(*)::int AS count
      FROM demo_events
      WHERE created_at >= p_from AND created_at < p_to
      GROUP BY 1, 2
      ORDER BY 1, 2
    ) sub
  );
END;
$$;

-- ── 5. Upgrade journey RPC with pagination ──
DROP FUNCTION IF EXISTS get_lead_journey(UUID);

CREATE OR REPLACE FUNCTION get_lead_journey(
  p_company_id UUID,
  p_limit      INT DEFAULT 500,
  p_offset     INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
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
      ORDER BY de.created_at DESC
      LIMIT p_limit
      OFFSET p_offset
    ) sub
  );
END;
$$;
