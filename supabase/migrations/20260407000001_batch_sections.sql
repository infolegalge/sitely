-- ============================================================
-- Batch Sections: Allow grouping batches into sections (e.g., clients)
-- Companies can be moved between batches across sections
-- ============================================================

-- 1. Add section column
ALTER TABLE batches ADD COLUMN IF NOT EXISTS section TEXT;

CREATE INDEX IF NOT EXISTS idx_batches_section ON batches (section)
  WHERE section IS NOT NULL;

-- 2. Update get_batch_list to only return regular (non-section) batches
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
      WHERE b.section IS NULL
      GROUP BY b.id, b.name, b.description, b.status, b.template_id,
               t.name, b.created_at, b.updated_at
    ) sub
  );
END;
$$;
