-- ============================================================
-- Dashboard RPC Functions
-- Replaces client-side aggregation with SQL-side computation.
-- All three functions used by the CMS dashboard on load.
-- ============================================================

-- Composite index: speeds up GROUP BY demo_id + event_type filtering in get_hot_leads
CREATE INDEX IF NOT EXISTS idx_events_demo_type ON demo_events (demo_id, event_type);


-- ============================================================
-- 1. get_company_stats()
-- Returns total counts and GROUP BY breakdowns for companies.
-- Replaces the while-loop that paginated the entire table.
-- ============================================================
CREATE OR REPLACE FUNCTION get_company_stats()
RETURNS JSON AS $$
DECLARE
  v_total        BIGINT;
  v_has_email    BIGINT;
  v_has_website  BIGINT;
  v_tier_dist    JSONB;
  v_status_dist  JSONB;
BEGIN
  SELECT COUNT(*)  INTO v_total       FROM companies;
  SELECT COUNT(*)  INTO v_has_email   FROM companies WHERE email   IS NOT NULL AND email   <> '';
  SELECT COUNT(*)  INTO v_has_website FROM companies WHERE website IS NOT NULL AND website <> '';

  SELECT COALESCE(jsonb_object_agg(tier::TEXT, cnt), '{}'::JSONB)
    INTO v_tier_dist
    FROM (
      SELECT tier, COUNT(*) AS cnt
      FROM companies
      WHERE tier IS NOT NULL
      GROUP BY tier
    ) t;

  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::JSONB)
    INTO v_status_dist
    FROM (
      SELECT status, COUNT(*) AS cnt
      FROM companies
      GROUP BY status
    ) t;

  RETURN json_build_object(
    'total',              v_total,
    'has_email',          v_has_email,
    'has_website',        v_has_website,
    'tier_distribution',  v_tier_dist,
    'status_distribution', v_status_dist
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 2. get_analytics_overview()
-- Returns funnel metrics and event-type counts.
-- Replaces full demo_events table transfer + JS counting.
-- ============================================================
CREATE OR REPLACE FUNCTION get_analytics_overview()
RETURNS JSON AS $$
DECLARE
  v_total        BIGINT;
  v_viewed       BIGINT;
  v_event_counts JSONB;
BEGIN
  SELECT COUNT(*) INTO v_total  FROM demos;
  SELECT COUNT(*) INTO v_viewed FROM demos WHERE view_count > 0;

  SELECT COALESCE(jsonb_object_agg(event_type, cnt), '{}'::JSONB)
    INTO v_event_counts
    FROM (
      SELECT event_type, COUNT(*) AS cnt
      FROM demo_events
      GROUP BY event_type
    ) t;

  RETURN json_build_object(
    'funnel', json_build_object(
      'sent',      v_total,
      'viewed',    v_viewed,
      'scrolled',  COALESCE((v_event_counts->>'scroll_100')::BIGINT, 0),
      'cta',       COALESCE((v_event_counts->>'click_cta')::BIGINT,  0)
                 + COALESCE((v_event_counts->>'click_phone')::BIGINT, 0)
                 + COALESCE((v_event_counts->>'click_email')::BIGINT, 0),
      'converted', COALESCE((v_event_counts->>'form_submit')::BIGINT, 0)
    ),
    'eventCounts', v_event_counts
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 3. get_hot_leads(p_limit INT)
-- Scores demos entirely in SQL, returns top N with company info.
-- Replaces: fetch all demos + fetch all events + JS scoring.
-- Scoring: view_count*1 + scroll_100*3 + time_60s*2 + click_cta*10 + form_submit*20
-- ============================================================
CREATE OR REPLACE FUNCTION get_hot_leads(p_limit INT DEFAULT 20)
RETURNS JSON AS $$
BEGIN
  RETURN (
    WITH event_agg AS (
      SELECT
        demo_id,
        COUNT(*) FILTER (WHERE event_type = 'scroll_100') AS scroll_100,
        COUNT(*) FILTER (WHERE event_type = 'time_60s')   AS time_60s,
        COUNT(*) FILTER (WHERE event_type = 'click_cta')  AS click_cta,
        COUNT(*) FILTER (WHERE event_type = 'click_phone') AS click_phone,
        COUNT(*) FILTER (WHERE event_type = 'click_email') AS click_email,
        COUNT(*) FILTER (WHERE event_type = 'form_submit') AS form_submit
      FROM demo_events
      WHERE demo_id IN (SELECT id FROM demos WHERE view_count > 0)
      GROUP BY demo_id
    ),
    scored AS (
      SELECT
        d.id                AS demo_id,
        d.company_id,
        d.view_count,
        d.first_viewed_at,
        d.last_viewed_at,
        d.status,
        c.id                AS c_id,
        c.name              AS c_name,
        c.email             AS c_email,
        c.phone             AS c_phone,
        c.category          AS c_category,
        COALESCE(d.view_count, 0)
          + COALESCE(ea.scroll_100,  0) * 3
          + COALESCE(ea.time_60s,    0) * 2
          + COALESCE(ea.click_cta,   0) * 10
          + COALESCE(ea.form_submit, 0) * 20  AS score,
        COALESCE(ea.scroll_100,   0) AS scroll_100,
        COALESCE(ea.time_60s,     0) AS time_60s,
        COALESCE(ea.click_cta,    0) AS click_cta,
        COALESCE(ea.click_phone,  0) AS click_phone,
        COALESCE(ea.click_email,  0) AS click_email,
        COALESCE(ea.form_submit,  0) AS form_submit
      FROM demos d
      JOIN companies c ON c.id = d.company_id
      LEFT JOIN event_agg ea ON ea.demo_id = d.id
      WHERE d.view_count > 0
      ORDER BY score DESC
      LIMIT p_limit
    )
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'demo_id',        demo_id,
          'company_id',     company_id,
          'view_count',     view_count,
          'first_viewed_at', first_viewed_at,
          'last_viewed_at', last_viewed_at,
          'status',         status,
          'score',          score,
          'company', json_build_object(
            'id',       c_id,
            'name',     c_name,
            'email',    c_email,
            'phone',    c_phone,
            'category', c_category
          ),
          'events', json_build_object(
            'scroll_100',  scroll_100,
            'time_60s',    time_60s,
            'click_cta',   click_cta,
            'click_phone', click_phone,
            'click_email', click_email,
            'form_submit', form_submit
          )
        )
      ),
      '[]'::JSON
    )
    FROM scored
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- ROLLBACK (run manually if needed):
-- DROP FUNCTION IF EXISTS get_company_stats();
-- DROP FUNCTION IF EXISTS get_analytics_overview();
-- DROP FUNCTION IF EXISTS get_hot_leads(INT);
-- DROP INDEX IF EXISTS idx_events_demo_type;
-- ============================================================
