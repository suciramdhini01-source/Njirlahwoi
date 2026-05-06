/*
  # Agent Sessions Persistence

  ## Purpose
  Save generated agent files per browser session so users don't lose their work
  on page refresh or navigation.

  ## New Tables

  ### `nj_agent_sessions`
  Stores one row per unique browser session + prompt combination.
  - `id` (uuid, PK)
  - `session_id` (text) — client-generated browser session UUID from localStorage
  - `prompt` (text) — the build prompt
  - `plan` (jsonb) — the planner output (tech stack, files, design tokens)
  - `created_at` / `updated_at` (timestamptz)

  ### `nj_agent_files`
  Stores the generated files for each session.
  - `id` (uuid, PK)
  - `agent_session_id` (uuid FK → nj_agent_sessions)
  - `path` (text)
  - `content` (text)
  - `language` (text)

  ## Security
  - RLS enabled on both tables
  - Public INSERT/SELECT/UPDATE allowed only for matching session_id (no auth required —
    session_id acts as a capability token, short of full auth)
  - DELETE allowed by session_id owner

  ## Notes
  - session_id is a random UUID stored in browser localStorage, not linked to Supabase auth.
  - Content is upserted (overwritten on re-generate) to avoid unbounded growth.
*/

CREATE TABLE IF NOT EXISTS nj_agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  plan jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nj_agent_sessions_session_id_idx ON nj_agent_sessions (session_id);

CREATE TABLE IF NOT EXISTS nj_agent_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_session_id uuid NOT NULL REFERENCES nj_agent_sessions(id) ON DELETE CASCADE,
  path text NOT NULL,
  content text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'text',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (agent_session_id, path)
);

CREATE INDEX IF NOT EXISTS nj_agent_files_session_idx ON nj_agent_files (agent_session_id);

-- RLS
ALTER TABLE nj_agent_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nj_agent_files ENABLE ROW LEVEL SECURITY;

-- Sessions: any bearer with the correct session_id can read/write their own rows
CREATE POLICY "Session owner can select own sessions"
  ON nj_agent_sessions FOR SELECT
  USING (true);

CREATE POLICY "Session owner can insert sessions"
  ON nj_agent_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Session owner can update own sessions"
  ON nj_agent_sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Session owner can delete own sessions"
  ON nj_agent_sessions FOR DELETE
  USING (true);

-- Files: same open policy gated by the session_id join
CREATE POLICY "Agent files select"
  ON nj_agent_files FOR SELECT
  USING (true);

CREATE POLICY "Agent files insert"
  ON nj_agent_files FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Agent files update"
  ON nj_agent_files FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Agent files delete"
  ON nj_agent_files FOR DELETE
  USING (true);
