-- ═══════════════════════════════════════════════════════
-- Drop duplicate RPC function signatures that cause
-- PostgREST PGRST203 "Could not choose the best candidate function"
-- ═══════════════════════════════════════════════════════

-- 1. get_behavioral_leaders: DROP the old 3-param version
--    (created in 20260404000004_sales_intelligence.sql)
--    Keep the 5-param version from 20260405000012_fix_rpc_errors.sql
DROP FUNCTION IF EXISTS get_behavioral_leaders(TEXT, INT, INT);

-- 2. get_lead_notes: DROP the old 1-param version
--    (created in 20260404000004_sales_intelligence.sql)
--    Keep the 3-param version from 20260405000005_performance_improvements.sql
DROP FUNCTION IF EXISTS get_lead_notes(UUID);
