-- ═══════════════════════════════════════════════════════
-- Analytics Enhancement: Bounce Rate, Form Events, Rage Click
-- ═══════════════════════════════════════════════════════

-- ── 1. Bounce rate function ──
-- A "bounce" = a session with exactly 1 page_open and a page_leave ≤ 10s,
-- or a session with only page_open and no other meaningful events.
CREATE OR REPLACE FUNCTION get_bounce_rate(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_from TIMESTAMPTZ := COALESCE(p_from, '2000-01-01'::timestamptz);
  v_to   TIMESTAMPTZ := COALESCE(p_to, NOW() + INTERVAL '1 day');
  total_sessions INT;
  bounce_sessions INT;
BEGIN
  -- Total unique sessions in period
  SELECT COUNT(DISTINCT session_id)::int INTO total_sessions
  FROM demo_events
  WHERE created_at >= v_from AND created_at < v_to
    AND session_id IS NOT NULL;

  -- Bounced sessions: only have page_open + page_leave (≤ 10s) or only page_open
  SELECT COUNT(*)::int INTO bounce_sessions
  FROM (
    SELECT session_id
    FROM demo_events
    WHERE created_at >= v_from AND created_at < v_to
      AND session_id IS NOT NULL
    GROUP BY session_id
    HAVING
      COUNT(DISTINCT event_type) <= 2
      AND COUNT(*) FILTER (WHERE event_type = 'page_open') > 0
      AND COUNT(*) FILTER (WHERE event_type NOT IN ('page_open', 'page_leave')) = 0
      AND COALESCE(MAX(CASE WHEN event_type = 'page_leave' THEN duration_ms END), 0) <= 10000
  ) bounced;

  RETURN json_build_object(
    'total_sessions', total_sessions,
    'bounce_sessions', bounce_sessions,
    'bounce_rate', CASE WHEN total_sessions > 0
      THEN ROUND((bounce_sessions::numeric / total_sessions) * 100, 1)
      ELSE 0
    END
  );
END;
$$;

-- ── 2. Ensure ip_country column exists ──
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'demo_events' AND column_name = 'ip_country'
  ) THEN
    ALTER TABLE demo_events ADD COLUMN ip_country TEXT;
    CREATE INDEX idx_demo_events_ip_country ON demo_events(ip_country);
  END IF;
END $$;

-- ── 3. Geographic breakdown function ──
CREATE OR REPLACE FUNCTION get_geo_breakdown(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
DECLARE
  v_from TIMESTAMPTZ := COALESCE(p_from, '2000-01-01'::timestamptz);
  v_to   TIMESTAMPTZ := COALESCE(p_to, NOW() + INTERVAL '1 day');
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
    FROM (
      SELECT
        COALESCE(ip_country, 'Unknown') AS country,
        COUNT(DISTINCT session_id)::int AS sessions,
        COUNT(*)::int AS events
      FROM demo_events
      WHERE created_at >= v_from AND created_at < v_to
        AND ip_country IS NOT NULL
      GROUP BY ip_country
      ORDER BY sessions DESC
      LIMIT p_limit
    ) sub
  );
END;
$$;

-- ── 4. Device breakdown function ──
-- Parses device type from the extra JSONB field (device.device_type)
CREATE OR REPLACE FUNCTION get_device_breakdown(
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
    SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
    FROM (
      SELECT
        COALESCE(extra->'device'->>'device_type', 'unknown') AS device_type,
        COUNT(DISTINCT session_id)::int AS sessions,
        COUNT(*)::int AS events
      FROM demo_events
      WHERE event_type = 'page_open'
        AND created_at >= v_from AND created_at < v_to
      GROUP BY device_type
      ORDER BY sessions DESC
    ) sub
  );
END;
$$;

-- ── 5. UTM source breakdown function ──
CREATE OR REPLACE FUNCTION get_utm_breakdown(
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
    SELECT COALESCE(json_agg(row_to_json(sub)), '[]'::json)
    FROM (
      SELECT
        COALESCE(extra->'utm'->>'utm_source', 'direct') AS source,
        COALESCE(extra->'utm'->>'utm_medium', '') AS medium,
        COALESCE(extra->'utm'->>'utm_campaign', '') AS campaign,
        COUNT(DISTINCT session_id)::int AS sessions,
        COUNT(*)::int AS events
      FROM demo_events
      WHERE event_type = 'page_open'
        AND created_at >= v_from AND created_at < v_to
      GROUP BY source, medium, campaign
      ORDER BY sessions DESC
      LIMIT 30
    ) sub
  );
END;
$$;

-- ── 6. Update overview to include bounce rate ──
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
  total_sessions INT;
  bounce_sessions INT;
  result JSON;
BEGIN
  -- Calculate bounce
  SELECT COUNT(DISTINCT session_id)::int INTO total_sessions
  FROM demo_events
  WHERE created_at >= v_from AND created_at < v_to
    AND session_id IS NOT NULL;

  SELECT COUNT(*)::int INTO bounce_sessions
  FROM (
    SELECT session_id
    FROM demo_events
    WHERE created_at >= v_from AND created_at < v_to
      AND session_id IS NOT NULL
    GROUP BY session_id
    HAVING
      COUNT(DISTINCT event_type) <= 2
      AND COUNT(*) FILTER (WHERE event_type = 'page_open') > 0
      AND COUNT(*) FILTER (WHERE event_type NOT IN ('page_open', 'page_leave')) = 0
      AND COALESCE(MAX(CASE WHEN event_type = 'page_leave' THEN duration_ms END), 0) <= 10000
  ) bounced;

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
      'totalSessions',    total_sessions,
      'bounceRate',       CASE WHEN total_sessions > 0
                            THEN ROUND((bounce_sessions::numeric / total_sessions) * 100, 1)
                            ELSE 0
                          END
    )
  ) INTO result;
  RETURN result;
END;
$$;
