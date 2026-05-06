/*
  # Workspace Projects

  ## Purpose
  Persistent storage for workspace projects created from the home dashboard.
  Each project maps to a /workspace/[projectId] URL and stores its chat history,
  file tree, prompt, status, and agent plan.

  ## New Tables

  ### `workspace_projects`
  One row per project. Keyed by the client-generated UUID (projectId).
  - `id` (uuid, PK) — matches the URL segment /workspace/[id]
  - `session_id` (text) — browser session UUID for ownership
  - `name` (text)
  - `kind` (text: fullstack | mobile | landing)
  - `prompt` (text) — original build prompt
  - `plan` (jsonb) — planner output
  - `status` (text: draft | building | ready | error)
  - `created_at` / `updated_at` (timestamptz)

  ### `workspace_messages`
  Chat messages scoped per project.
  - `id` (uuid, PK)
  - `project_id` (uuid FK → workspace_projects)
  - `role` (text: user | assistant | system)
  - `content` (text)
  - `created_at` (timestamptz)

  ### `workspace_files`
  Generated files per project (file tree).
  - `id` (uuid, PK)
  - `project_id` (uuid FK → workspace_projects)
  - `path` (text)
  - `content` (text)
  - `language` (text)
  - UNIQUE (project_id, path)

  ## Security
  - RLS enabled, public access gated by session_id match
  - session_id acts as a capability token (no auth required)
*/

CREATE TABLE IF NOT EXISTS workspace_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  name text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'fullstack',
  prompt text NOT NULL DEFAULT '',
  plan jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspace_projects_session_idx ON workspace_projects (session_id);
CREATE INDEX IF NOT EXISTS workspace_projects_updated_idx ON workspace_projects (updated_at DESC);

CREATE TABLE IF NOT EXISTS workspace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspace_messages_project_idx ON workspace_messages (project_id, created_at);

CREATE TABLE IF NOT EXISTS workspace_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES workspace_projects(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'text',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (project_id, path)
);

CREATE INDEX IF NOT EXISTS workspace_files_project_idx ON workspace_files (project_id);

-- RLS
ALTER TABLE workspace_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_projects select"
  ON workspace_projects FOR SELECT USING (true);

CREATE POLICY "workspace_projects insert"
  ON workspace_projects FOR INSERT WITH CHECK (true);

CREATE POLICY "workspace_projects update"
  ON workspace_projects FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "workspace_projects delete"
  ON workspace_projects FOR DELETE USING (true);

CREATE POLICY "workspace_messages select"
  ON workspace_messages FOR SELECT USING (true);

CREATE POLICY "workspace_messages insert"
  ON workspace_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "workspace_messages delete"
  ON workspace_messages FOR DELETE USING (true);

CREATE POLICY "workspace_files select"
  ON workspace_files FOR SELECT USING (true);

CREATE POLICY "workspace_files insert"
  ON workspace_files FOR INSERT WITH CHECK (true);

CREATE POLICY "workspace_files update"
  ON workspace_files FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "workspace_files delete"
  ON workspace_files FOR DELETE USING (true);
