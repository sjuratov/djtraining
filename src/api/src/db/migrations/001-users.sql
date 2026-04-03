CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'pending',
  auth_provider TEXT NOT NULL DEFAULT 'local',
  confirmation_token TEXT,
  token_expires_at TEXT,
  google_id TEXT UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS member_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  birth_date TEXT,
  gender TEXT,
  training_goal TEXT,
  experience_level TEXT,
  health_notes TEXT NOT NULL DEFAULT '',
  training_type TEXT,
  sessions_per_week INTEGER,
  preferred_times TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_confirmation_token ON users(confirmation_token);
