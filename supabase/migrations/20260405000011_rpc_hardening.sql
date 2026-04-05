-- ═══════════════════════════════════════════════════
-- RPC Hardening: toggle_favorite + update_sales_status
-- Fixes: NULL return on missing company, invalid status values
-- ═══════════════════════════════════════════════════

-- Fix toggle_favorite: raise error if company not found
CREATE OR REPLACE FUNCTION toggle_favorite(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new BOOLEAN;
BEGIN
  UPDATE companies
  SET is_favorite = NOT COALESCE(is_favorite, false), updated_at = now()
  WHERE id = p_company_id
  RETURNING is_favorite INTO v_new;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id
      USING ERRCODE = 'P0002';
  END IF;

  RETURN v_new;
END;
$$;

-- Fix update_sales_status: validate status is in allowed enum
CREATE OR REPLACE FUNCTION update_sales_status(
  p_company_id UUID,
  p_sales_status TEXT,
  p_next_followup TIMESTAMPTZ DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid_statuses TEXT[] := ARRAY[
    'new', 'contacted', 'negotiating', 'won', 'lost'
  ];
BEGIN
  IF NOT (p_sales_status = ANY(v_valid_statuses)) THEN
    RAISE EXCEPTION 'Invalid sales_status: %. Allowed: %', p_sales_status, v_valid_statuses
      USING ERRCODE = 'P0001';
  END IF;

  UPDATE companies
  SET
    sales_status = p_sales_status,
    next_followup_at = p_next_followup,
    updated_at = now()
  WHERE id = p_company_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Company not found: %', p_company_id
      USING ERRCODE = 'P0002';
  END IF;
END;
$$;
