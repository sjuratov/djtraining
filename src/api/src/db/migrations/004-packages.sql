CREATE TABLE IF NOT EXISTS package_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  training_category TEXT NOT NULL CHECK (training_category IN ('personal', 'gruppe', 'ernaehrung')),
  total_sessions INTEGER NOT NULL,
  price_chf INTEGER NOT NULL,
  validity_days INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS client_packages (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  package_def_id TEXT NOT NULL REFERENCES package_definitions(id),
  total_sessions INTEGER NOT NULL,
  remaining_sessions INTEGER NOT NULL,
  purchased_at TEXT NOT NULL,
  expires_at TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'depleted')),
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_packages_user ON client_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_client_packages_status ON client_packages(status);
CREATE INDEX IF NOT EXISTS idx_client_packages_user_status ON client_packages(user_id, status);

INSERT OR IGNORE INTO package_definitions (id, name, training_category, total_sessions, price_chf, validity_days, active, created_at)
VALUES
  ('pkg-personal-1', 'Personal Training Einzelstunde', 'personal', 1, 10000, NULL, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-personal-20', 'Personal Training 20er-Abo', 'personal', 20, 190000, 365, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-personal-40', 'Personal Training 40er-Abo', 'personal', 40, 360000, 365, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-hiit-1', 'HIIT Training Einzelstunde', 'personal', 1, 5000, NULL, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-hiit-20', 'HIIT Training 20er-Abo', 'personal', 20, 96000, 365, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-hiit-40', 'HIIT Training 40er-Abo', 'personal', 40, 180000, 365, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-vibration-1', 'Vibrationstraining Einzelstunde', 'personal', 1, 8000, NULL, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-vibration-20', 'Vibrationstraining 20er-Abo', 'personal', 20, 144000, 365, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-vibration-40', 'Vibrationstraining 40er-Abo', 'personal', 40, 256000, 365, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-gruppe-1', 'Gruppentraining Einzelstunde', 'gruppe', 1, 2500, NULL, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-gruppe-20', 'Gruppentraining 20er-Abo', 'gruppe', 20, 46000, 365, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-gruppe-40', 'Gruppentraining 40er-Abo', 'gruppe', 40, 80000, 365, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-ernaehrung-1', 'Ernährungscoaching Einzelstunde', 'ernaehrung', 1, 10000, NULL, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-ernaehrung-5', 'Ernährungscoaching 5er-Abo', 'ernaehrung', 5, 45000, 180, 1, '2026-01-01T00:00:00.000Z'),
  ('pkg-ernaehrung-10', 'Ernährungscoaching 10er-Abo', 'ernaehrung', 10, 90000, 365, 1, '2026-01-01T00:00:00.000Z');
