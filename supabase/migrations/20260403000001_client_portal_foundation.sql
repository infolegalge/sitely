-- ============================================================
-- Sprint 1: Client Portal Foundation
-- Creates: packages, projects, proposals, project_timeline_steps,
--          messages, project_files
-- Alters:  onboard_tokens (add demo_id, project_id)
-- ============================================================

-- ─── 1. packages ────────────────────────────────────────────
CREATE TABLE packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  base_price  NUMERIC(10,2) NOT NULL,
  currency    TEXT NOT NULL DEFAULT 'GEL',
  features    JSONB NOT NULL DEFAULT '{}'::JSONB,
  -- shape: { "included": [...], "excluded": [...], "addons": [...] }
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_packages" ON packages FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "client_read_packages" ON packages FOR SELECT
  USING (is_active = true);

-- ─── 2. projects ────────────────────────────────────────────
CREATE TABLE projects (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  demo_id        UUID REFERENCES demos(id) ON DELETE SET NULL,
  client_name    TEXT NOT NULL,
  client_email   TEXT NOT NULL,
  client_phone   TEXT NOT NULL,
  client_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  status TEXT NOT NULL DEFAULT 'lead_new'
    CHECK (status IN (
      'lead_new',           -- form submitted, magic link sent
      'lead_negotiating',   -- in chat/call negotiation
      'proposal_sent',      -- proposal sent, awaiting payment
      'active_collecting',  -- paid — awaiting client assets
      'active_designing',   -- design phase
      'active_developing',  -- development phase
      'active_review',      -- client is reviewing
      'completed',          -- done
      'cancelled',
      'lost'
    )),

  admin_notes TEXT,
  assigned_to TEXT,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_projects_company    ON projects (company_id);
CREATE INDEX idx_projects_demo       ON projects (demo_id);
CREATE INDEX idx_projects_client_uid ON projects (client_user_id);
CREATE INDEX idx_projects_status     ON projects (status);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_projects" ON projects FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "client_read_own_project" ON projects FOR SELECT
  USING (client_user_id = auth.uid());

-- ─── 3. proposals ───────────────────────────────────────────
CREATE TABLE proposals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  package_id UUID REFERENCES packages(id) ON DELETE SET NULL,

  -- Immutable snapshot — survives package price changes
  snapshot   JSONB NOT NULL,
  -- shape: { "price": 500, "currency": "GEL", "title": "...",
  --          "included": [...], "excluded": [...] }

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),

  payment_method    TEXT,
  paid_at           TIMESTAMPTZ,
  stripe_session_id TEXT,

  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proposals_project ON proposals (project_id);
CREATE INDEX idx_proposals_status  ON proposals (status);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_proposals" ON proposals FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "client_read_own_proposal" ON proposals FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
  );

-- ─── 4. project_timeline_steps ──────────────────────────────
CREATE TABLE project_timeline_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  step_order  INTEGER NOT NULL,
  title       TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'active', 'completed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_steps_project ON project_timeline_steps (project_id);
CREATE UNIQUE INDEX idx_steps_order ON project_timeline_steps (project_id, step_order);

ALTER TABLE project_timeline_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_steps" ON project_timeline_steps FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "client_read_own_steps" ON project_timeline_steps FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
  );

-- ─── 5. messages ────────────────────────────────────────────
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES auth.users(id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('client', 'admin')),

  content     TEXT,           -- plain text message
  file_url    TEXT,           -- Supabase Storage URL
  file_name   TEXT,
  file_type   TEXT,           -- MIME type
  file_size   INTEGER,

  is_read     BOOLEAN NOT NULL DEFAULT false,
  is_system   BOOLEAN NOT NULL DEFAULT false,  -- status-change notice
  is_internal BOOLEAN NOT NULL DEFAULT false,  -- admin-only note

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_project ON messages (project_id);
CREATE INDEX idx_messages_unread  ON messages (project_id, is_read) WHERE NOT is_read;

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Admin sees everything
CREATE POLICY "admin_all_messages" ON messages FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

-- Client reads non-internal messages from own projects
CREATE POLICY "client_read_messages" ON messages FOR SELECT
  USING (
    is_internal = false
    AND project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
  );

-- Client inserts non-internal messages to own projects
CREATE POLICY "client_insert_messages" ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND is_internal = false
    AND is_system = false
    AND project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
  );

-- Client marks own project messages as read
CREATE POLICY "client_update_read" ON messages FOR UPDATE
  USING (
    project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
    AND is_internal = false
  )
  WITH CHECK (
    is_internal = false
    AND is_system = false
  );

-- Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- ─── 6. project_files ───────────────────────────────────────
CREATE TABLE project_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  file_url    TEXT NOT NULL,
  file_name   TEXT NOT NULL,
  file_type   TEXT NOT NULL,
  file_size   INTEGER NOT NULL,
  category    TEXT NOT NULL DEFAULT 'general'
    CHECK (category IN ('logo', 'photo', 'document', 'general')),
  message_id  UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_files_project ON project_files (project_id);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_files" ON project_files FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin');

CREATE POLICY "client_read_own_files" ON project_files FOR SELECT
  USING (
    project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
  );

CREATE POLICY "client_insert_own_files" ON project_files FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid()
    AND project_id IN (SELECT id FROM projects WHERE client_user_id = auth.uid())
  );

-- ─── 7. Alter onboard_tokens ────────────────────────────────
-- Add project_id — ties the magic-link token to a project
ALTER TABLE onboard_tokens
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_onboard_tokens_project ON onboard_tokens (project_id);

-- ─── 8. Storage bucket: project-assets ──────────────────────
-- NOTE: run `npx supabase storage create project-assets` in CLI,
-- or create manually in the Dashboard. SQL below sets RLS on objects
-- after the bucket is created.

-- Client upload: path must start with their project id
CREATE POLICY "client_upload_assets" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-assets'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM projects WHERE client_user_id = auth.uid()
    )
  );

-- Client read: own project folder + admins
CREATE POLICY "client_read_assets" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'project-assets'
    AND (
      (storage.foldername(name))[1] IN (
        SELECT id::text FROM projects WHERE client_user_id = auth.uid()
      )
      OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
    )
  );

-- Admin full access on storage
CREATE POLICY "admin_all_assets" ON storage.objects FOR ALL
  USING (
    bucket_id = 'project-assets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  )
  WITH CHECK (
    bucket_id = 'project-assets'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'super_admin'
  );
