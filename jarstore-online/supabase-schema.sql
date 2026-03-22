-- ═══════════════════════════════════════════════════════════
-- JarStore v2 — Schema Supabase (FRESH INSTALL)
-- ═══════════════════════════════════════════════════════════

DROP TABLE IF EXISTS submission_log CASCADE;
DROP TABLE IF EXISTS programs CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id                  SERIAL PRIMARY KEY,
  github_id           TEXT        UNIQUE NOT NULL,
  github_username     TEXT        NOT NULL,
  email               TEXT,
  avatar_url          TEXT,
  -- pending → in attesa revisione admin
  -- active  → approvato, può caricare (max 2)
  -- whitelisted → verificato (max 5)
  -- admin   → admin (illimitato)
  -- superadmin → CosmoUniverso (intoccabile)
  -- banned  → bannato (0 accessi)
  user_status         TEXT        DEFAULT 'pending'
                      CHECK (user_status IN ('pending','active','whitelisted','admin','superadmin','banned')),
  ban_reason          TEXT,
  github_created_at   TIMESTAMPTZ,
  github_public_repos INT         DEFAULT 0,
  is_new              BOOLEAN     DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE programs (
  id             SERIAL PRIMARY KEY,
  name           TEXT        NOT NULL,
  description    TEXT        DEFAULT '',
  version        TEXT        DEFAULT '1.0.0',
  tags           TEXT        DEFAULT '',
  contributors   TEXT        DEFAULT '',
  status         TEXT        DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected')),
  file_path      TEXT,
  original_name  TEXT        NOT NULL,
  file_size      BIGINT      DEFAULT 0,
  uploader_id    INT         REFERENCES users(id) ON DELETE SET NULL,
  admin_note     TEXT,
  download_count INT         DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE submission_log (
  id         SERIAL PRIMARY KEY,
  user_id    INT         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_programs_status   ON programs(status);
CREATE INDEX idx_programs_uploader ON programs(uploader_id);
CREATE INDEX idx_sublog_user       ON submission_log(user_id, created_at);
CREATE INDEX idx_users_status      ON users(user_status);

-- Funzione incremento download
CREATE OR REPLACE FUNCTION increment_downloads(program_id INT)
RETURNS void AS $$
  UPDATE programs SET download_count = download_count + 1 WHERE id = program_id;
$$ LANGUAGE sql;
