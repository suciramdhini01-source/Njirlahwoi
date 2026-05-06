/*
  # Create project steps (sub-agent pipeline)

  1. New Tables
    - `nj_project_steps`
      - `id` (uuid, primary key)
      - `project_id` (uuid, fk -> nj_projects)
      - `session_id` (text)
      - `role` (text) — planner | designer | coder | reviewer
      - `status` (text) — pending | running | done | error
      - `input_json` (jsonb)
      - `output_json` (jsonb)
      - `tokens_in`, `tokens_out`, `latency_ms` (int)
      - `order_idx` (int)
      - `created_at`, `updated_at` (timestamptz)

  2. Security
    - RLS enabled
    - Anon + authenticated can read/insert/update (same public BYOK model as sibling tables)

  3. Notes
    - Used by `nj-agent-orchestrate` edge function to persist & resume each sub-agent's output.
*/

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

CREATE INDEX IF NOT EXISTS nj_project_steps_project_idx
  ON nj_project_steps(project_id, order_idx);

ALTER TABLE nj_project_steps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_steps' AND policyname='Anyone can read nj_project_steps') THEN
    CREATE POLICY "Anyone can read nj_project_steps"
      ON nj_project_steps FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_steps' AND policyname='Anyone can insert nj_project_steps') THEN
    CREATE POLICY "Anyone can insert nj_project_steps"
      ON nj_project_steps FOR INSERT
      TO anon, authenticated
      WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='nj_project_steps' AND policyname='Anyone can update nj_project_steps') THEN
    CREATE POLICY "Anyone can update nj_project_steps"
      ON nj_project_steps FOR UPDATE
      TO anon, authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
