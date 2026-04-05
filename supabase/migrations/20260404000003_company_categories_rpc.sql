-- ============================================================
-- get_company_categories()
-- Returns DISTINCT category and source_category lists.
-- Replaces the while-loop that paginated the entire table.
-- ============================================================

CREATE OR REPLACE FUNCTION get_company_categories()
RETURNS JSON AS $$
DECLARE
  v_categories        TEXT[];
  v_source_categories TEXT[];
BEGIN
  SELECT ARRAY(
    SELECT DISTINCT category
    FROM companies
    WHERE category IS NOT NULL AND category <> ''
    ORDER BY category
  ) INTO v_categories;

  SELECT ARRAY(
    SELECT DISTINCT source_category
    FROM companies
    WHERE source_category IS NOT NULL AND source_category <> ''
    ORDER BY source_category
  ) INTO v_source_categories;

  RETURN json_build_object(
    'categories',        v_categories,
    'source_categories', v_source_categories
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ROLLBACK:
-- DROP FUNCTION IF EXISTS get_company_categories();
