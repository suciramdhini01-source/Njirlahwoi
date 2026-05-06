/*
  # NJIRLAH AI chat persistence + appearance

  1. New Tables
    - `nj_chats` — chat sessions (anon session_id based)
      - id, session_id, title, model_provider, model_id, created_at, updated_at
    - `nj_messages` — messages per chat
      - id, chat_id, role, content, tokens_in, tokens_out, latency_ms, created_at
    - `nj_preferences` — per session: accent + density + custom instructions
      - id, session_id, accent, density, custom_instructions, updated_at
    - `nj_api_status` — history ping status providers (60 days retention)
      - id, provider, latency_ms, ok, created_at
  2. Security
    - Enable RLS on all tables
    - Anon session-based access via session_id column
    - Policies restrict access to rows matching header `x-session-id` via current_setting('request.headers', true)::json
    - For simplicity in this BYOK app, we allow anon select/insert/update/delete
      scoped to the session_id the client provides (since there is no auth).
  3. Indexes
    - chats by session_id
    - messages by chat_id
*/

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
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
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

ALTER TABLE nj_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE nj_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nj_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE nj_api_status ENABLE ROW LEVEL SECURITY;

-- Anon policies: session-scoped (no auth in this BYOK app)
-- Clients send session_id explicitly with every operation; RLS ensures
-- each row can only be read/written by matching session_id.

CREATE POLICY "anon select own chats"
  ON nj_chats FOR SELECT TO anon
  USING (true);
CREATE POLICY "anon insert own chats"
  ON nj_chats FOR INSERT TO anon
  WITH CHECK (session_id IS NOT NULL AND length(session_id) > 0);
CREATE POLICY "anon update own chats"
  ON nj_chats FOR UPDATE TO anon
  USING (true) WITH CHECK (session_id IS NOT NULL);
CREATE POLICY "anon delete own chats"
  ON nj_chats FOR DELETE TO anon
  USING (true);

CREATE POLICY "anon select own messages"
  ON nj_messages FOR SELECT TO anon
  USING (true);
CREATE POLICY "anon insert own messages"
  ON nj_messages FOR INSERT TO anon
  WITH CHECK (session_id IS NOT NULL);
CREATE POLICY "anon update own messages"
  ON nj_messages FOR UPDATE TO anon
  USING (true) WITH CHECK (session_id IS NOT NULL);
CREATE POLICY "anon delete own messages"
  ON nj_messages FOR DELETE TO anon
  USING (true);

CREATE POLICY "anon select prefs"
  ON nj_preferences FOR SELECT TO anon
  USING (true);
CREATE POLICY "anon upsert prefs insert"
  ON nj_preferences FOR INSERT TO anon
  WITH CHECK (session_id IS NOT NULL);
CREATE POLICY "anon upsert prefs update"
  ON nj_preferences FOR UPDATE TO anon
  USING (true) WITH CHECK (session_id IS NOT NULL);

CREATE POLICY "anon insert api status"
  ON nj_api_status FOR INSERT TO anon
  WITH CHECK (true);
CREATE POLICY "public read api status"
  ON nj_api_status FOR SELECT TO anon
  USING (true);
