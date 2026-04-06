-- Fix: active_time CTE was only reading extra->>'total_active_seconds'
-- but the webhook was storing the value as extra->>'active_seconds'.
-- Now reads both keys with COALESCE for backwards compatibility.

CREATE OR REPLACE VIEW company_lead_scores AS
WITH event_weights AS (
  SELECT
    d.company_id,
    de.session_id,
    de.created_at          AS event_at,
    de.event_type,
    de.section_name,
    de.is_main_site,
    de.interaction_type,
    de.extra,
    CASE de.event_type
      WHEN 'page_open'       THEN 1
      WHEN 'scroll_25'       THEN 1
      WHEN 'scroll_50'       THEN 2
      WHEN 'scroll_75'       THEN 3
      WHEN 'scroll_100'      THEN 5
      WHEN 'active_time_10s' THEN 1
      WHEN 'active_time_30s' THEN 2
      WHEN 'active_time_60s' THEN 4
      WHEN 'active_time_180s' THEN 8
      WHEN 'active_time_300s' THEN 12
      WHEN 'click_phone'     THEN 15
      WHEN 'click_email'     THEN 15
      WHEN 'click_cta'       THEN 20
      WHEN 'click_sitely'    THEN 10
      WHEN 'form_submit'     THEN 50
      WHEN 'section_view'    THEN 2
      WHEN 'interaction_3d'  THEN 5
      ELSE 0
    END AS raw_weight,
    EXP(LN(0.5) * EXTRACT(EPOCH FROM (now() - de.created_at)) / (7 * 86400))
      AS decay_factor
  FROM demo_events de
  JOIN demos d ON d.id = de.demo_id
),
scored AS (
  SELECT
    company_id,
    ROUND(SUM(raw_weight * decay_factor))::INT AS momentum_score,
    SUM(raw_weight)::INT                       AS alltime_score,
    MAX(event_at)                               AS last_activity,
    COUNT(DISTINCT session_id)                  AS total_sessions,
    BOOL_OR(is_main_site OR event_type = 'click_sitely') AS visited_main_site
  FROM event_weights
  GROUP BY company_id
),
active_time AS (
  SELECT
    d.company_id,
    SUM(COALESCE(
      (de.extra->>'total_active_seconds')::INT,
      (de.extra->>'active_seconds')::INT,
      0
    )) AS total_active_s
  FROM demo_events de
  JOIN demos d ON d.id = de.demo_id
  WHERE de.event_type = 'page_leave'
  GROUP BY d.company_id
),
top_sections AS (
  SELECT DISTINCT ON (company_id)
    d.company_id,
    de.section_name,
    SUM(COALESCE((de.extra->>'duration_s')::INT, 0)) AS section_time_s
  FROM demo_events de
  JOIN demos d ON d.id = de.demo_id
  WHERE de.event_type = 'section_view' AND de.section_name IS NOT NULL
  GROUP BY d.company_id, de.section_name
  ORDER BY d.company_id, section_time_s DESC
)
SELECT
  s.company_id,
  s.momentum_score,
  s.alltime_score,
  s.last_activity,
  s.total_sessions,
  s.visited_main_site,
  COALESCE(at.total_active_s, 0)  AS total_active_s,
  ts.section_name                  AS top_section
FROM scored s
LEFT JOIN active_time at ON at.company_id = s.company_id
LEFT JOIN top_sections ts ON ts.company_id = s.company_id;
