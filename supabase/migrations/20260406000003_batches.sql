-- ============================================================
-- Batch / Cluster System
-- Groups demos into trackable batches for cohort analytics
-- ============================================================

-- ── 1. Batches table ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_status ON batches (status);
CREATE INDEX IF NOT EXISTS idx_batches_created ON batches (created_at DESC);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_batches_updated ON batches;
CREATE TRIGGER trg_batches_updated
  BEFORE UPDATE ON batches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ── 2. Add batch_id FK to demos ──────────────────────────────
ALTER TABLE demos
  ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_demos_batch_id ON demos (batch_id)
  WHERE batch_id IS NOT NULL;


-- ── 3. RLS for batches ───────────────────────────────────────
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_batches" ON batches;
CREATE POLICY "admin_all_batches" ON batches
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );

DROP POLICY IF EXISTS "service_role_all_batches" ON batches;
CREATE POLICY "service_role_all_batches" ON batches
  FOR ALL USING (
    auth.role() = 'service_role'
  );


-- ── 4. RPC: get_batch_list ───────────────────────────────────
-- Returns all batches with aggregated demo/engagement counts
CREATE OR REPLACE FUNCTION get_batch_list()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(json_agg(row_to_json(sub) ORDER BY sub.created_at DESC), '[]'::json)
    FROM (
      SELECT
        b.id,
        b.name,
        b.description,
        b.status,
        b.template_id,
        t.name            AS template_name,
        b.created_at,
        b.updated_at,
        COUNT(d.id)::int  AS total_demos,
        COUNT(d.id) FILTER (WHERE d.status IN ('sent','viewed'))::int  AS total_sent,
        COUNT(d.id) FILTER (WHERE d.view_count > 0)::int              AS viewed_count,
        COUNT(DISTINCT cls.company_id)
          FILTER (WHERE cls.momentum_score >= 10)::int                 AS engaged_count,
        COUNT(DISTINCT cls.company_id)
          FILTER (WHERE cls.momentum_score >= 50)::int                 AS converted_count
      FROM batches b
      LEFT JOIN templates t ON t.id = b.template_id
      LEFT JOIN demos d ON d.batch_id = b.id
      LEFT JOIN company_lead_scores cls ON cls.company_id = d.company_id
      GROUP BY b.id, b.name, b.description, b.status, b.template_id,
               t.name, b.created_at, b.updated_at
    ) sub
  );
END;
$$;


-- ── 5. RPC: get_batch_analytics ──────────────────────────────
-- Returns full per-company analytics for a single batch
CREATE OR REPLACE FUNCTION get_batch_analytics(p_batch_id UUID)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER STABLE
AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'batch', (
        SELECT row_to_json(b_sub)
        FROM (
          SELECT b.id, b.name, b.description, b.status,
                 b.template_id, t.name AS template_name,
                 b.created_at, b.updated_at
          FROM batches b
          LEFT JOIN templates t ON t.id = b.template_id
          WHERE b.id = p_batch_id
        ) b_sub
      ),
      'summary', (
        SELECT row_to_json(s_sub)
        FROM (
          SELECT
            COUNT(d.id)::int                                            AS total_demos,
            COUNT(d.id) FILTER (WHERE d.status IN ('sent','viewed'))::int AS total_sent,
            COUNT(d.id) FILTER (WHERE d.view_count > 0)::int            AS viewed_count,
            ROUND(AVG(CASE WHEN d.view_count > 0
              THEN COALESCE(at_sub.avg_session_s, 0) END), 1)::float    AS avg_session_s,
            ROUND(AVG(CASE WHEN d.view_count > 0
              THEN COALESCE(sc_sub.max_scroll, 0) END), 1)::float       AS avg_scroll_depth
          FROM demos d
          LEFT JOIN LATERAL (
            SELECT ROUND(AVG(de.duration_ms / 1000.0), 1) AS avg_session_s
            FROM demo_events de
            WHERE de.demo_id = d.id AND de.event_type = 'page_leave'
          ) at_sub ON true
          LEFT JOIN LATERAL (
            SELECT MAX(de.scroll_depth) AS max_scroll
            FROM demo_events de
            WHERE de.demo_id = d.id AND de.scroll_depth IS NOT NULL
          ) sc_sub ON true
          WHERE d.batch_id = p_batch_id
        ) s_sub
      ),
      'funnel', (
        SELECT row_to_json(f_sub)
        FROM (
          SELECT
            COUNT(d.id)::int                                               AS sent,
            COUNT(d.id) FILTER (WHERE d.view_count > 0)::int               AS viewed,
            COUNT(DISTINCT d.id) FILTER (WHERE EXISTS (
              SELECT 1 FROM demo_events de
              WHERE de.demo_id = d.id AND de.scroll_depth >= 50
            ))::int                                                        AS scrolled_50,
            COUNT(DISTINCT d.id) FILTER (WHERE EXISTS (
              SELECT 1 FROM demo_events de
              WHERE de.demo_id = d.id
              AND de.event_type IN ('click_cta','click_phone','click_email')
            ))::int                                                        AS cta_clicked,
            COUNT(DISTINCT d.id) FILTER (WHERE EXISTS (
              SELECT 1 FROM demo_events de
              WHERE de.demo_id = d.id AND de.event_type = 'form_submit'
            ))::int                                                        AS form_submitted
          FROM demos d
          WHERE d.batch_id = p_batch_id
        ) f_sub
      ),
      'companies', (
        SELECT COALESCE(json_agg(row_to_json(c_sub) ORDER BY c_sub.momentum_score DESC NULLS LAST), '[]'::json)
        FROM (
          SELECT
            c.id              AS company_id,
            c.name,
            c.category,
            c.email,
            c.phone,
            c.sales_status,
            c.is_favorite,
            d.id              AS demo_id,
            d.hash            AS demo_hash,
            d.status          AS demo_status,
            d.view_count,
            d.first_viewed_at,
            d.last_viewed_at,
            COALESCE(cls.momentum_score, 0)   AS momentum_score,
            COALESCE(cls.alltime_score, 0)    AS alltime_score,
            COALESCE(cls.total_sessions, 0)   AS total_sessions,
            COALESCE(cls.total_active_s, 0)   AS total_active_s,
            cls.last_activity,
            cls.visited_main_site,
            cls.top_section,
            -- Per-demo CTA clicks
            (SELECT COUNT(*)::int FROM demo_events de
             WHERE de.demo_id = d.id
             AND de.event_type IN ('click_cta','click_phone','click_email')
            ) AS cta_clicks,
            -- Per-demo form submits
            (SELECT COUNT(*)::int FROM demo_events de
             WHERE de.demo_id = d.id AND de.event_type = 'form_submit'
            ) AS form_submits,
            -- Max scroll depth for this demo
            (SELECT COALESCE(MAX(de.scroll_depth), 0)::int FROM demo_events de
             WHERE de.demo_id = d.id AND de.scroll_depth IS NOT NULL
            ) AS max_scroll,
            -- Avg session duration for this demo
            (SELECT ROUND(AVG(de.duration_ms / 1000.0), 1)
             FROM demo_events de
             WHERE de.demo_id = d.id AND de.event_type = 'page_leave'
            )::float AS avg_session_s,
            -- Portal access check
            (EXISTS (
              SELECT 1 FROM projects p
              WHERE p.company_id = c.id AND p.client_user_id IS NOT NULL
            )) AS portal_accessed
          FROM demos d
          JOIN companies c ON c.id = d.company_id
          LEFT JOIN company_lead_scores cls ON cls.company_id = c.id
          WHERE d.batch_id = p_batch_id
        ) c_sub
      )
    )
  );
END;
$$;
