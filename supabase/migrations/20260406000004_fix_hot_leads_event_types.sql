-- Fix get_hot_leads: change 'time_60s' -> 'active_time_60s'
-- The client tracker sends 'active_time_60s', not 'time_60s'.
-- This caused the time-based component of the lead score to always be 0.

CREATE OR REPLACE FUNCTION get_hot_leads(p_limit INT DEFAULT 20)
RETURNS JSON AS $$
BEGIN
  RETURN (
    WITH event_agg AS (
      SELECT
        demo_id,
        COUNT(*) FILTER (WHERE event_type = 'scroll_100')      AS scroll_100,
        COUNT(*) FILTER (WHERE event_type = 'active_time_60s')  AS active_time_60s,
        COUNT(*) FILTER (WHERE event_type = 'click_cta')        AS click_cta,
        COUNT(*) FILTER (WHERE event_type = 'click_phone')      AS click_phone,
        COUNT(*) FILTER (WHERE event_type = 'click_email')      AS click_email,
        COUNT(*) FILTER (WHERE event_type = 'form_submit')      AS form_submit
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
          + COALESCE(ea.scroll_100,       0) * 3
          + COALESCE(ea.active_time_60s,  0) * 2
          + COALESCE(ea.click_cta,        0) * 10
          + COALESCE(ea.form_submit,      0) * 20  AS score,
        COALESCE(ea.scroll_100,        0) AS scroll_100,
        COALESCE(ea.active_time_60s,   0) AS active_time_60s,
        COALESCE(ea.click_cta,         0) AS click_cta,
        COALESCE(ea.click_phone,       0) AS click_phone,
        COALESCE(ea.click_email,       0) AS click_email,
        COALESCE(ea.form_submit,       0) AS form_submit
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
            'scroll_100',      scroll_100,
            'active_time_60s', active_time_60s,
            'click_cta',       click_cta,
            'click_phone',     click_phone,
            'click_email',     click_email,
            'form_submit',     form_submit
          )
        )
      ),
      '[]'::JSON
    )
    FROM scored
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
