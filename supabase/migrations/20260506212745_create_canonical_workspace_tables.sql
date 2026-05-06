/*
  # Canonical Workspace Tables

  Creates the workspace_projects, workspace_files, and workspace_messages tables
  used by the WorkspaceStore. These use the clean names (no nj_ prefix) that
  match the store queries.

  ## Tables

  ### workspace_projects
  One row per project, scoped to a browser session_id.

  ### workspace_files
  Generated source files for a project (upserted per path).

  ### workspace_messages
  Chat messages per project.

  ## Security
  RLS enabled with open policies — session_id acts as capability token.
*/

CREATE TABLE IF NOT EXISTS workspace_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'fullstack',
  prompt text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  plan jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspace_projects_session_idx ON workspace_projects (session_id);
CREATE INDEX IF NOT EXISTS workspace_projects_updated_idx ON workspace_projects (updated_at DESC);

CREATE TABLE IF NOT EXISTS workspace_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'text',
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_id, path)
);

CREATE INDEX IF NOT EXISTS workspace_files_project_idx ON workspace_files (project_id);

CREATE TABLE IF NOT EXISTS workspace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  model_id text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'openrouter',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspace_messages_project_idx ON workspace_messages (project_id);
CREATE INDEX IF NOT EXISTS workspace_messages_created_idx ON workspace_messages (created_at ASC);

-- RLS
ALTER TABLE workspace_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_projects' AND policyname = 'ws projects select') THEN
    CREATE POLICY "ws projects select" ON workspace_projects FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_projects' AND policyname = 'ws projects insert') THEN
    CREATE POLICY "ws projects insert" ON workspace_projects FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_projects' AND policyname = 'ws projects update') THEN
    CREATE POLICY "ws projects update" ON workspace_projects FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_projects' AND policyname = 'ws projects delete') THEN
    CREATE POLICY "ws projects delete" ON workspace_projects FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_files' AND policyname = 'ws files select') THEN
    CREATE POLICY "ws files select" ON workspace_files FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_files' AND policyname = 'ws files insert') THEN
    CREATE POLICY "ws files insert" ON workspace_files FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_files' AND policyname = 'ws files update') THEN
    CREATE POLICY "ws files update" ON workspace_files FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_files' AND policyname = 'ws files delete') THEN
    CREATE POLICY "ws files delete" ON workspace_files FOR DELETE USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_messages' AND policyname = 'ws messages select') THEN
    CREATE POLICY "ws messages select" ON workspace_messages FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_messages' AND policyname = 'ws messages insert') THEN
    CREATE POLICY "ws messages insert" ON workspace_messages FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspace_messages' AND policyname = 'ws messages delete') THEN
    CREATE POLICY "ws messages delete" ON workspace_messages FOR DELETE USING (true);
  END IF;
END $$;
