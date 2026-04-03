CREATE TABLE IF NOT EXISTS training_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('personal', 'gruppe', 'ernaehrung')),
  duration_minutes INTEGER NOT NULL,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  price_single INTEGER,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS schedule_templates (
  id TEXT PRIMARY KEY,
  training_type_id TEXT NOT NULL REFERENCES training_types(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS time_slots (
  id TEXT PRIMARY KEY,
  template_id TEXT REFERENCES schedule_templates(id),
  training_type_id TEXT NOT NULL REFERENCES training_types(id),
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'cancelled', 'full')),
  max_capacity INTEGER NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedule_templates_type ON schedule_templates(training_type_id);
CREATE INDEX IF NOT EXISTS idx_schedule_templates_day ON schedule_templates(day_of_week);
CREATE INDEX IF NOT EXISTS idx_time_slots_date ON time_slots(date);
CREATE INDEX IF NOT EXISTS idx_time_slots_template ON time_slots(template_id);
CREATE INDEX IF NOT EXISTS idx_time_slots_type_date ON time_slots(training_type_id, date);
