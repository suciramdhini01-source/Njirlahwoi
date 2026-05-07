import { pool } from "./db";

const SQL = `
CREATE TABLE IF NOT EXISTS njiriah_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS njiriah_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_messages int DEFAULT 0,
  unique_sessions int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS njiriah_stats_date_idx ON njiriah_stats (date);

CREATE TABLE IF NOT EXISTS nj_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  title text NOT NULL DEFAULT 'Obrolan baru',
  model_provider text NOT NULL DEFAULT 'replit',
  model_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nj_chats_session_idx ON nj_chats(session_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS nj_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES nj_chats(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  role text NOT NULL,
  content text NOT NULL DEFAULT '',
  tokens_in int NOT NULL DEFAULT 0,
  tokens_out int NOT NULL DEFAULT 0,
  latency_ms int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nj_messages_chat_idx ON nj_messages(chat_id, created_at ASC);

CREATE TABLE IF NOT EXISTS nj_preferences (
  session_id text PRIMARY KEY,
  accent text NOT NULL DEFAULT 'violet',
  density text NOT NULL DEFAULT 'default',
  custom_instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS nj_api_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  latency_ms int NOT NULL DEFAULT 0,
  ok boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nj_api_status_provider_idx ON nj_api_status(provider, created_at DESC);

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
CREATE INDEX IF NOT EXISTS nj_projects_session_idx ON nj_projects(session_id, updated_at DESC);

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
CREATE INDEX IF NOT EXISTS nj_project_clarifications_project_idx ON nj_project_clarifications(project_id, order_idx);

CREATE TABLE IF NOT EXISTS nj_project_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES nj_projects(id) ON DELETE CASCADE,
  session_id text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'planner',
  status text NOT NULL DEFAULT 'pending',
  input_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  latency_ms integer NOT NULL DEFAULT 0,
  order_idx integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nj_project_steps_project_idx ON nj_project_steps(project_id, order_idx);

CREATE TABLE IF NOT EXISTS nj_project_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES nj_projects(id) ON DELETE SET NULL,
  session_id text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'running',
  total_tokens_in integer NOT NULL DEFAULT 0,
  total_tokens_out integer NOT NULL DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nj_project_runs_project_idx ON nj_project_runs(project_id);
CREATE INDEX IF NOT EXISTS nj_project_runs_session_idx ON nj_project_runs(session_id);

CREATE TABLE IF NOT EXISTS nj_run_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES nj_project_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'agent_log',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  seq integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS nj_run_events_run_seq_idx ON nj_run_events(run_id, seq);

CREATE TABLE IF NOT EXISTS nj_agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  prompt text NOT NULL DEFAULT '',
  plan jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS nj_agent_sessions_session_id_idx ON nj_agent_sessions (session_id);

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
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log("Running database migrations...");
    await client.query(SQL);
    console.log("Migrations complete.");
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
