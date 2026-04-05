-- ============================================================
-- Add offer_draft & custom_email_text to demos table
-- Allows pre-attaching a proposal offer and custom email body
-- before demo generation, so when a client claims the demo,
-- the proposal is auto-created in their portal.
-- ============================================================

ALTER TABLE demos
  ADD COLUMN IF NOT EXISTS offer_draft JSONB,
  ADD COLUMN IF NOT EXISTS custom_email_text TEXT;

-- offer_draft shape:
-- {
--   "package_id": "uuid | null",
--   "price": 500,
--   "currency": "GEL",
--   "title": "პაკეტის სახელი",
--   "included": ["..."],
--   "excluded": ["..."],
--   "notes": "დამატებითი შენიშვნა"
-- }

COMMENT ON COLUMN demos.offer_draft IS 'Pre-sale offer snapshot (JSONB) attached before sending. Auto-converts to proposal on claim.';
COMMENT ON COLUMN demos.custom_email_text IS 'Custom email body text set by admin before sending. Used instead of default template text.';
