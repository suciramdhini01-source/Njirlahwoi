/*
  # NJIR LAH Built-in LLM — Tables

  1. New Tables
    - `njiriah_messages`
      - `id` (uuid, PK)
      - `session_id` (text) — anonymous session ID from client
      - `role` (text) — 'user' or 'assistant'
      - `content` (text)
      - `created_at` (timestamptz)

    - `njiriah_stats`
      - `id` (uuid, PK)
      - `date` (date) — day bucket
      - `total_messages` (int) — total messages that day
      - `unique_sessions` (int)
      - `updated_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Anonymous users can INSERT messages (to log their own)
    - No SELECT for anonymous (privacy)
    - Stats table: public SELECT allowed (for dashboard)

  3. Notes
    - session_id is client-generated UUID, not tied to auth
    - This enables usage logging while keeping NJIR LAH free & open
*/

CREATE TABLE IF NOT EXISTS njiriah_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE njiriah_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert their messages"
  ON njiriah_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS njiriah_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL DEFAULT CURRENT_DATE,
  total_messages int DEFAULT 0,
  unique_sessions int DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE njiriah_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view stats"
  ON njiriah_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS njiriah_stats_date_idx ON njiriah_stats (date);
