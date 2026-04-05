-- ═══════════════════════════════════════════════════════
-- Backfill duration_ms and scroll_depth from extra JSON
-- for existing page_leave events where these columns are NULL
-- Then refresh the materialized view
-- ═══════════════════════════════════════════════════════

-- Backfill duration_ms from extra->>'duration_ms'
UPDATE demo_events
SET duration_ms = (extra->>'duration_ms')::int
WHERE event_type = 'page_leave'
  AND duration_ms IS NULL
  AND extra->>'duration_ms' IS NOT NULL;

-- Backfill scroll_depth from extra->>'scroll_depth'
UPDATE demo_events
SET scroll_depth = (extra->>'scroll_depth')::numeric
WHERE event_type = 'page_leave'
  AND scroll_depth IS NULL
  AND extra->>'scroll_depth' IS NOT NULL;

-- Also backfill scroll_depth from scroll events 
-- (scroll_25=25, scroll_50=50, scroll_75=75, scroll_100=100)
UPDATE demo_events
SET scroll_depth = (extra->>'depth')::numeric
WHERE event_type IN ('scroll_25','scroll_50','scroll_75','scroll_100')
  AND scroll_depth IS NULL
  AND extra->>'depth' IS NOT NULL;

-- Refresh materialized view to pick up the backfilled data
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_session_summaries;
