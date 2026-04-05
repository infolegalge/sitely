-- Campaign comparison: per-UTM-campaign funnel metrics
CREATE OR REPLACE FUNCTION get_campaign_comparison(
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
        COALESCE(e.extra->'utm'->>'utm_source', 'direct')     AS source,
        COALESCE(e.extra->'utm'->>'utm_medium', '')            AS medium,
        COALESCE(e.extra->'utm'->>'utm_campaign', '')          AS campaign,
        COUNT(DISTINCT e.session_id)::int                       AS sessions,
        COUNT(DISTINCT e.session_id)
          FILTER (WHERE e.event_type = 'scroll_100')::int       AS scroll_complete,
        COUNT(DISTINCT e.session_id)
          FILTER (WHERE e.event_type IN ('click_cta','click_phone','click_email'))::int AS cta_clicks,
        COUNT(DISTINCT e.session_id)
          FILTER (WHERE e.event_type = 'form_submit')::int      AS form_submits,
        ROUND(AVG(e.duration_ms / 1000.0)
          FILTER (WHERE e.event_type = 'page_leave'), 1)::float AS avg_session_s,
        CASE
          WHEN COUNT(DISTINCT e.session_id) > 0
          THEN ROUND(
            COUNT(DISTINCT e.session_id)
              FILTER (WHERE e.event_type = 'form_submit')::numeric
            / COUNT(DISTINCT e.session_id) * 100, 2
          )::float
          ELSE 0
        END AS conversion_rate
      FROM demo_events e
      WHERE e.created_at >= v_from AND e.created_at < v_to
        AND e.session_id IS NOT NULL
      GROUP BY source, medium, campaign
      HAVING COUNT(DISTINCT e.session_id) >= 2
      ORDER BY sessions DESC
      LIMIT 20
    ) sub
  );
END;
$$;
