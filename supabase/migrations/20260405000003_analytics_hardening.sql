-- ═══════════════════════════════════════════════════════
-- Analytics Hardening: Weighted Scoring, Data Retention,
-- Performance Indexes, Funnel Abandonment
-- ═══════════════════════════════════════════════════════

-- ── 1. Weighted engagement score RPC (replaces naive +1 increment) ──
CREATE OR REPLACE FUNCTION increment_engagement_score_weighted(
  p_demo_id TEXT,
  p_score   INT DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE companies
  SET engagement_score = COALESCE(engagement_score, 0) + p_score,
      updated_at = NOW()
  WHERE id = (
    SELECT company_id FROM demos WHERE id::TEXT = p_demo_id LIMIT 1
  );
END;
$$;

-- ── 2. Composite indexes for performance ──
CREATE INDEX IF NOT EXISTS idx_events_demo_created
  ON demo_events (demo_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_session_type
  ON demo_events (session_id, event_type);

CREATE INDEX IF NOT EXISTS idx_events_type_created
  ON demo_events (event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_demos_company_id
  ON demos (company_id);

-- ── 3. Funnel abandonment tracking ──
-- Shows drop-off between each funnel step per time period
CREATE OR REPLACE FUNCTION get_funnel_abandonment(
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
    WITH sessions AS (
      SELECT
        session_id,
        BOOL_OR(event_type = 'page_open') AS saw_page,
        BOOL_OR(event_type IN ('scroll_25','scroll_50','scroll_75','scroll_100')) AS scrolled_any,
        BOOL_OR(event_type = 'scroll_100') AS scrolled_full,
        BOOL_OR(event_type IN ('click_cta','click_phone','click_email')) AS clicked_cta,
        BOOL_OR(event_type = 'form_start') AS started_form,
        BOOL_OR(event_type = 'form_submit') AS submitted_form,
        BOOL_OR(event_type = 'form_abandon') AS abandoned_form,
        MAX(CASE WHEN event_type = 'page_leave' THEN duration_ms ELSE NULL END) AS session_duration_ms
      FROM demo_events
      WHERE created_at >= v_from AND created_at < v_to
        AND session_id IS NOT NULL
      GROUP BY session_id
    )
    SELECT json_build_object(
      'total_sessions', COUNT(*)::int,
      'saw_page', COUNT(*) FILTER (WHERE saw_page)::int,
      'scrolled_any', COUNT(*) FILTER (WHERE scrolled_any)::int,
      'scrolled_full', COUNT(*) FILTER (WHERE scrolled_full)::int,
      'clicked_cta', COUNT(*) FILTER (WHERE clicked_cta)::int,
      'started_form', COUNT(*) FILTER (WHERE started_form)::int,
      'submitted_form', COUNT(*) FILTER (WHERE submitted_form)::int,
      'abandoned_form', COUNT(*) FILTER (WHERE abandoned_form)::int,
      'avg_session_ms', ROUND(AVG(session_duration_ms))::int,
      'dropoff', json_build_object(
        'page_to_scroll', CASE WHEN COUNT(*) FILTER (WHERE saw_page) > 0
          THEN ROUND((1 - COUNT(*) FILTER (WHERE scrolled_any)::numeric / GREATEST(COUNT(*) FILTER (WHERE saw_page), 1)) * 100, 1)
          ELSE 0 END,
        'scroll_to_cta', CASE WHEN COUNT(*) FILTER (WHERE scrolled_any) > 0
          THEN ROUND((1 - COUNT(*) FILTER (WHERE clicked_cta)::numeric / GREATEST(COUNT(*) FILTER (WHERE scrolled_any), 1)) * 100, 1)
          ELSE 0 END,
        'cta_to_form', CASE WHEN COUNT(*) FILTER (WHERE clicked_cta) > 0
          THEN ROUND((1 - COUNT(*) FILTER (WHERE started_form)::numeric / GREATEST(COUNT(*) FILTER (WHERE clicked_cta), 1)) * 100, 1)
          ELSE 0 END,
        'form_to_submit', CASE WHEN COUNT(*) FILTER (WHERE started_form) > 0
          THEN ROUND((1 - COUNT(*) FILTER (WHERE submitted_form)::numeric / GREATEST(COUNT(*) FILTER (WHERE started_form), 1)) * 100, 1)
          ELSE 0 END,
        'form_abandon_rate', CASE WHEN COUNT(*) FILTER (WHERE started_form) > 0
          THEN ROUND(COUNT(*) FILTER (WHERE abandoned_form)::numeric / GREATEST(COUNT(*) FILTER (WHERE started_form), 1) * 100, 1)
          ELSE 0 END
      )
    )
    FROM sessions
  );
END;
$$;

-- ── 4. Referrer breakdown ──
CREATE OR REPLACE FUNCTION get_referrer_breakdown(
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
        COALESCE(
          CASE
            WHEN referrer IS NULL OR referrer = '' THEN 'direct'
            WHEN referrer ~* 'google' THEN 'Google'
            WHEN referrer ~* 'facebook|fb\.' THEN 'Facebook'
            WHEN referrer ~* 'instagram' THEN 'Instagram'
            WHEN referrer ~* 'linkedin' THEN 'LinkedIn'
            WHEN referrer ~* 'twitter|x\.com' THEN 'Twitter/X'
            WHEN referrer ~* 'sitely' THEN 'Sitely'
            ELSE SUBSTRING(referrer FROM '://([^/]+)')
          END,
          'other'
        ) AS source,
        COUNT(DISTINCT session_id)::int AS sessions,
        COUNT(*)::int AS events
      FROM demo_events
      WHERE event_type = 'page_open'
        AND created_at >= v_from AND created_at < v_to
      GROUP BY source
      ORDER BY sessions DESC
      LIMIT p_limit
    ) sub
  );
END;
$$;

-- ── 5. Top sections breakdown ──
CREATE OR REPLACE FUNCTION get_top_sections(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 15
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
        section_name,
        COUNT(*)::int AS views,
        COUNT(DISTINCT session_id)::int AS unique_sessions,
        ROUND(AVG(COALESCE((extra->>'duration_s')::int, 0)))::int AS avg_duration_s
      FROM demo_events
      WHERE event_type = 'section_view'
        AND section_name IS NOT NULL
        AND created_at >= v_from AND created_at < v_to
      GROUP BY section_name
      ORDER BY views DESC
      LIMIT p_limit
    ) sub
  );
END;
$$;

-- ── 6. Data retention: cleanup function for old events ──
-- Call this via Inngest cron or pg_cron to archive/delete events older than N days
CREATE OR REPLACE FUNCTION cleanup_old_events(
  p_retention_days INT DEFAULT 180
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  cutoff TIMESTAMPTZ := NOW() - (p_retention_days || ' days')::interval;
  deleted_count INT;
BEGIN
  DELETE FROM demo_events
  WHERE created_at < cutoff
  RETURNING 1;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN json_build_object(
    'deleted', deleted_count,
    'cutoff_date', cutoff,
    'retention_days', p_retention_days
  );
END;
$$;
