import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const migration = `
-- ============================================
-- CMS Dynamic Demo System — Full Migration
-- ============================================

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  yell_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier INTEGER,
  tier_label TEXT,
  score INTEGER,
  email TEXT,
  phone TEXT,
  website TEXT,
  address TEXT,
  category TEXT,
  categories TEXT,
  source_category TEXT,
  rating REAL,
  reviews_count INTEGER,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  gm_place_id TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. TEMPLATES TABLE
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  industry TEXT NOT NULL,
  thumbnail_url TEXT,
  html_content TEXT NOT NULL,
  fallback_images TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. EMAIL_CAMPAIGNS TABLE (must exist before demos FK)
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  subject TEXT,
  body_template TEXT,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  total_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  opened_count INTEGER NOT NULL DEFAULT 0,
  clicked_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. DEMOS TABLE
CREATE TABLE IF NOT EXISTS demos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT UNIQUE NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  html_snapshot TEXT,
  sent_at TIMESTAMPTZ,
  first_viewed_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  view_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. DEMO_EVENTS TABLE
CREATE TABLE IF NOT EXISTS demo_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  page_url TEXT,
  referrer TEXT,
  duration_ms INTEGER,
  scroll_depth INTEGER,
  user_agent TEXT,
  ip_country TEXT,
  session_id TEXT,
  extra JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
`;

const indexes = `
-- COMPANIES INDEXES
CREATE INDEX IF NOT EXISTS idx_companies_yell_id ON companies (yell_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies (name);
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies (slug);
CREATE INDEX IF NOT EXISTS idx_companies_tier ON companies (tier);
CREATE INDEX IF NOT EXISTS idx_companies_score ON companies (score);
CREATE INDEX IF NOT EXISTS idx_companies_email ON companies (email);
CREATE INDEX IF NOT EXISTS idx_companies_website ON companies (website);
CREATE INDEX IF NOT EXISTS idx_companies_category ON companies (category);
CREATE INDEX IF NOT EXISTS idx_companies_source_cat ON companies (source_category);
CREATE INDEX IF NOT EXISTS idx_companies_rating ON companies (rating);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies (status);

-- DEMOS INDEXES
CREATE INDEX IF NOT EXISTS idx_demos_hash ON demos (hash);
CREATE INDEX IF NOT EXISTS idx_demos_company ON demos (company_id);
CREATE INDEX IF NOT EXISTS idx_demos_campaign ON demos (campaign_id);
CREATE INDEX IF NOT EXISTS idx_demos_status ON demos (status);

-- DEMO_EVENTS INDEXES
CREATE INDEX IF NOT EXISTS idx_events_demo ON demo_events (demo_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON demo_events (event_type);
CREATE INDEX IF NOT EXISTS idx_events_session ON demo_events (session_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON demo_events (created_at);
`;

const triggers = `
-- AUTO-UPDATE updated_at TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- COMPANIES TRIGGER
DROP TRIGGER IF EXISTS trg_companies_updated ON companies;
CREATE TRIGGER trg_companies_updated
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- TEMPLATES TRIGGER
DROP TRIGGER IF EXISTS trg_templates_updated ON templates;
CREATE TRIGGER trg_templates_updated
  BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`;

const fullTextSearch = `
-- FULL-TEXT SEARCH COLUMN (Generated)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE companies ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (
        to_tsvector('simple',
          coalesce(name, '') || ' ' ||
          coalesce(address, '') || ' ' ||
          coalesce(category, '') || ' ' ||
          coalesce(categories, '')
        )
      ) STORED;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_companies_search ON companies USING GIN (search_vector);
`;

const rls = `
-- ROW LEVEL SECURITY

-- Companies RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_companies" ON companies;
CREATE POLICY "admin_all_companies" ON companies
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
DROP POLICY IF EXISTS "service_role_all_companies" ON companies;
CREATE POLICY "service_role_all_companies" ON companies
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Templates RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_templates" ON templates;
CREATE POLICY "admin_all_templates" ON templates
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
DROP POLICY IF EXISTS "service_role_all_templates" ON templates;
CREATE POLICY "service_role_all_templates" ON templates
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Demos RLS
ALTER TABLE demos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_demos" ON demos;
CREATE POLICY "admin_all_demos" ON demos
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
DROP POLICY IF EXISTS "public_read_demos" ON demos;
CREATE POLICY "public_read_demos" ON demos
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "service_role_all_demos" ON demos;
CREATE POLICY "service_role_all_demos" ON demos
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Demo Events RLS
ALTER TABLE demo_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anyone_insert_events" ON demo_events;
CREATE POLICY "anyone_insert_events" ON demo_events
  FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "admin_read_events" ON demo_events;
CREATE POLICY "admin_read_events" ON demo_events
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
DROP POLICY IF EXISTS "service_role_all_events" ON demo_events;
CREATE POLICY "service_role_all_events" ON demo_events
  FOR ALL USING (
    auth.role() = 'service_role'
  );

-- Email Campaigns RLS
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "admin_all_campaigns" ON email_campaigns;
CREATE POLICY "admin_all_campaigns" ON email_campaigns
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'super_admin'
  );
DROP POLICY IF EXISTS "service_role_all_campaigns" ON email_campaigns;
CREATE POLICY "service_role_all_campaigns" ON email_campaigns
  FOR ALL USING (
    auth.role() = 'service_role'
  );
`;

async function runMigration() {
  console.log('🚀 Starting CMS Database Migration...\n');

  const steps = [
    { name: '1. Creating tables', sql: migration },
    { name: '2. Creating indexes', sql: indexes },
    { name: '3. Creating triggers (updated_at)', sql: triggers },
    { name: '4. Creating Full-Text Search', sql: fullTextSearch },
    { name: '5. Enabling Row Level Security', sql: rls },
  ];

  for (const step of steps) {
    console.log(`⏳ ${step.name}...`);
    const { error } = await supabase.rpc('', {}).then(() => ({ error: null })).catch(() => ({ error: 'rpc not available' }));

    // Use the SQL editor via REST API
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({}),
      }
    );

    // Since we can't run raw SQL via REST, use supabase CLI
    break;
  }

  console.log('\n⚠️  Raw SQL must be run via Supabase CLI or Dashboard SQL Editor.');
  console.log('Using supabase db push approach instead...');
}

// Instead, write the full SQL to a file and execute via supabase CLI
import { writeFileSync } from 'fs';

const fullSQL = [migration, indexes, triggers, fullTextSearch, rls].join('\n\n');
writeFileSync('supabase/migrations/001_cms_schema.sql', fullSQL);
console.log('✅ Migration file written to: supabase/migrations/001_cms_schema.sql');
console.log('Run: npx supabase db push --linked to apply');
