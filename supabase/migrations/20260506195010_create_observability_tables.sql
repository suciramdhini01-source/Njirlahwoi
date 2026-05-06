/*
  # Create observability tables: nj_project_runs + nj_run_events

  1. New Tables
    - `nj_project_runs`
      - `id` (uuid, primary key)
      - `project_id` (uuid, fk -> nj_projects, nullable for standalone agent runs)
      - `session_id` (text)
      - `status` (text) — running | done | error | cancelled
      - `total_tokens_in`, `total_tokens_out` (int)
      - `started_at`, `ended_at` (timestamptz)
      - `created_at` (timestamptz)

    - `nj_run_events`
      - `id` (uuid, primary key)
      - `run_id` (uuid, fk -> nj_project_runs)
      - `event_type` (text) — file_start | file_end | agent_log | tool_call | done | error
      - `payload` (jsonb)
      - `seq` (int) — sequence order within run
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Anon + authenticated can read/insert/update (BYOK public model)

  3. Notes
    - Used to persist SSE stream events for replay/resume and debugging
    - Index on (run_id, seq) for fast ordered replay
*/

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

ALTER TABLE nj_project_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_runs' AND policyname='Anyone can read nj_project_runs') THEN
    CREATE POLICY "Anyone can read nj_project_runs"
      ON nj_project_runs FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_runs' AND policyname='Anyone can insert nj_project_runs') THEN
    CREATE POLICY "Anyone can insert nj_project_runs"
      ON nj_project_runs FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_runs' AND policyname='Anyone can update nj_project_runs') THEN
    CREATE POLICY "Anyone can update nj_project_runs"
      ON nj_project_runs FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS nj_run_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES nj_project_runs(id) ON DELETE CASCADE,
  event_type text NOT NULL DEFAULT 'agent_log',
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  seq integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nj_run_events_run_seq_idx ON nj_run_events(run_id, seq);

ALTER TABLE nj_run_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_run_events' AND policyname='Anyone can read nj_run_events') THEN
    CREATE POLICY "Anyone can read nj_run_events"
      ON nj_run_events FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_run_events' AND policyname='Anyone can insert nj_run_events') THEN
    CREATE POLICY "Anyone can insert nj_run_events"
      ON nj_run_events FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
END $$;
