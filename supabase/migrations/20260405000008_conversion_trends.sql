-- ═══════════════════════════════════════════════════════
-- Conversion rate trend + Template performance comparison
-- ═══════════════════════════════════════════════════════

-- ── 1. Daily conversion rate trends (% at each funnel step per day) ──
CREATE OR REPLACE FUNCTION get_conversion_trends(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(d) ORDER BY d.day), '[]'::json)
    FROM (
      SELECT
        DATE(e.created_at) AS day,
        COUNT(DISTINCT e.session_id)::int AS sessions,
        COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'page_open')::int AS viewed,
        COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type IN ('scroll_25','scroll_50','scroll_75','scroll_100'))::int AS scrolled,
        COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type IN ('click_cta','click_phone','click_email'))::int AS clicked_cta,
        COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'form_start')::int AS started_form,
        COUNT(DISTINCT e.session_id) FILTER (WHERE e.event_type = 'form_submit')::int AS submitted
      FROM demo_events e
      WHERE (p_from IS NULL OR e.created_at >= p_from)
        AND (p_to IS NULL OR e.created_at <= p_to)
      GROUP BY DATE(e.created_at)
      ORDER BY day
    ) d
  );
END;
$$;

-- ── 2. Template performance comparison ──
CREATE OR REPLACE FUNCTION get_template_performance(
  p_from TIMESTAMPTZ DEFAULT NULL,
  p_to   TIMESTAMPTZ DEFAULT NULL,
  p_limit INT DEFAULT 20
)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
    FROM (
      SELECT
        d.template_id,
        COALESCE(
          (SELECT name FROM templates WHERE id = d.template_id),
          'უცნობი'
        ) AS template_name,
        COUNT(DISTINCT d.id)::int AS demos_sent,
        COUNT(DISTINCT d.id) FILTER (WHERE d.view_count > 0)::int AS demos_viewed,
        COUNT(DISTINCT e.session_id)::int AS total_sessions,
        COUNT(*) FILTER (WHERE e.event_type = 'page_open')::int AS page_opens,
        COUNT(*) FILTER (WHERE e.event_type IN ('click_cta','click_phone','click_email'))::int AS cta_clicks,
        COUNT(*) FILTER (WHERE e.event_type = 'form_submit')::int AS form_submits,
        COUNT(*) FILTER (WHERE e.event_type = 'scroll_100')::int AS full_scrolls,
        ROUND(AVG(CASE WHEN e.event_type = 'page_leave' THEN e.duration_ms END) / 1000.0, 1) AS avg_session_s,
        CASE WHEN COUNT(*) FILTER (WHERE e.event_type = 'page_open') > 0
          THEN ROUND(COUNT(*) FILTER (WHERE e.event_type = 'form_submit')::numeric /
               COUNT(*) FILTER (WHERE e.event_type = 'page_open') * 100, 1)
          ELSE 0
        END AS conversion_rate
      FROM demos d
      LEFT JOIN demo_events e ON e.demo_id = d.id
        AND (p_from IS NULL OR e.created_at >= p_from)
        AND (p_to IS NULL OR e.created_at <= p_to)
      WHERE d.template_id IS NOT NULL
        AND d.status != 'draft'
      GROUP BY d.template_id
      HAVING COUNT(DISTINCT d.id) >= 1
      ORDER BY conversion_rate DESC
      LIMIT p_limit
    ) t
  );
END;
$$;
