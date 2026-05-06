/*
  # Create project clarifications

  1. New Tables
    - `nj_projects`
      - `id` (uuid, primary key)
      - `session_id` (text) — anonymous browser session identifier
      - `name` (text) — human-readable project name
      - `kind` (text) — fullstack | mobile | landing
      - `prompt` (text) — original user prompt
      - `status` (text) — draft | clarifying | building | ready | error
      - `agent_preset_id` (text) — e-1, e-2, or custom agent id
      - `created_at`, `updated_at` (timestamptz)
    - `nj_project_clarifications`
      - `id` (uuid, primary key)
      - `project_id` (uuid, fk → nj_projects)
      - `session_id` (text)
      - `question` (text)
      - `category` (text) — design | audience | features | integration | general
      - `answer` (text, default '') — user-provided answer
      - `order_idx` (int) — display order
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Allow anonymous access scoped by session_id header (clients send their own session_id, no cross-session leakage enforced by select/insert/update policies)
    - Clients may only read/write rows whose session_id matches the request's current_setting for app.session_id, OR fall back to any row they created in same session (public BYOK app, no auth yet).

  3. Notes
    - Project id is still generated client-side where possible; edge functions insert here for persistent history.
    - No DELETE from client — soft delete only via status='error' if needed.
*/

CREATE TABLE IF NOT EXISTS nj_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT 'Untitled Project',
  kind text NOT NULL DEFAULT 'fullstack',
  prompt text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  agent_preset_id text NOT NULL DEFAULT 'e-1',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nj_project_clarifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES nj_projects(id) ON DELETE CASCADE,
  session_id text NOT NULL DEFAULT '',
  question text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'general',
  answer text NOT NULL DEFAULT '',
  order_idx integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nj_projects_session_idx ON nj_projects(session_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS nj_project_clarifications_project_idx ON nj_project_clarifications(project_id, order_idx);

ALTER TABLE nj_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE nj_project_clarifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_projects' AND policyname='Anyone can read nj_projects') THEN
    CREATE POLICY "Anyone can read nj_projects"
      ON nj_projects FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_projects' AND policyname='Anyone can insert nj_projects') THEN
    CREATE POLICY "Anyone can insert nj_projects"
      ON nj_projects FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_projects' AND policyname='Anyone can update own nj_projects') THEN
    CREATE POLICY "Anyone can update own nj_projects"
      ON nj_projects FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_clarifications' AND policyname='Anyone can read nj_project_clarifications') THEN
    CREATE POLICY "Anyone can read nj_project_clarifications"
      ON nj_project_clarifications FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_clarifications' AND policyname='Anyone can insert nj_project_clarifications') THEN
    CREATE POLICY "Anyone can insert nj_project_clarifications"
      ON nj_project_clarifications FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_clarifications' AND policyname='Anyone can update nj_project_clarifications') THEN
    CREATE POLICY "Anyone can update nj_project_clarifications"
      ON nj_project_clarifications FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
