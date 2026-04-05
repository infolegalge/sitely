-- Session duration percentiles + scroll depth histogram

-- ── 1. Session duration percentiles ──
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
      'p10_s',  ROUND(PERCENTILE_CONT(0.10) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0, 1),
      'p25_s',  ROUND(PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0, 1),
      'p50_s',  ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0, 1),
      'p75_s',  ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0, 1),
      'p90_s',  ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0, 1),
      'p95_s',  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0, 1),
      'p99_s',  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY session_duration_ms) / 1000.0, 1),
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

-- ── 2. Scroll depth histogram ──
CREATE OR REPLACE FUNCTION get_scroll_depth_histogram(
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
      'avg_depth', ROUND(AVG(max_scroll_depth)::numeric, 1),
      'p50_depth', ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY max_scroll_depth)::numeric, 1),
      'p75_depth', ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY max_scroll_depth)::numeric, 1),
      'p90_depth', ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY max_scroll_depth)::numeric, 1),
      'full_scroll_pct', ROUND(
        COUNT(*) FILTER (WHERE scrolled_full)::numeric / NULLIF(COUNT(*), 0) * 100, 1
      ),
      'buckets', (
        SELECT COALESCE(json_agg(row_to_json(b) ORDER BY b.range_start), '[]'::json)
        FROM (
          SELECT
            CASE
              WHEN max_scroll_depth < 10  THEN 0
              WHEN max_scroll_depth < 25  THEN 10
              WHEN max_scroll_depth < 50  THEN 25
              WHEN max_scroll_depth < 75  THEN 50
              WHEN max_scroll_depth < 90  THEN 75
              WHEN max_scroll_depth < 100 THEN 90
              ELSE 100
            END AS range_start,
            CASE
              WHEN max_scroll_depth < 10  THEN '0-10%'
              WHEN max_scroll_depth < 25  THEN '10-25%'
              WHEN max_scroll_depth < 50  THEN '25-50%'
              WHEN max_scroll_depth < 75  THEN '50-75%'
              WHEN max_scroll_depth < 90  THEN '75-90%'
              WHEN max_scroll_depth < 100 THEN '90-99%'
              ELSE '100%'
            END AS label,
            COUNT(*)::int AS count
          FROM mv_session_summaries
          WHERE max_scroll_depth IS NOT NULL
            AND started_at >= v_from AND started_at < v_to
          GROUP BY range_start, label
        ) b
      )
    )
    FROM mv_session_summaries
    WHERE max_scroll_depth IS NOT NULL
      AND started_at >= v_from AND started_at < v_to
  );
END;
$$;
