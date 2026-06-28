-- =============================================================
-- 001_init.sql — Hábitos (tablas, índices, constraints)
-- Convenciones:
--   * IDs generados en el frontend (TS) con crypto.randomUUID()
--   * Timestamps: ISO 8601 UTC con offset (TEXT)
--   * Fechas locales: YYYY-MM-DD (TEXT)
--   * Lógica de negocio: NULA en SQL. Rust es solo I/O.
-- =============================================================

-- Metadata de migraciones
CREATE TABLE IF NOT EXISTS schema_version (
  version     INTEGER PRIMARY KEY,
  applied_at  TEXT NOT NULL
);

-- Hábitos: definiciones
DROP TABLE IF EXISTS habit_logs;
DROP TABLE IF EXISTS habits;
CREATE TABLE IF NOT EXISTS habits (
  id                TEXT    PRIMARY KEY,
  name              TEXT    NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 100),
  description       TEXT             CHECK (description IS NULL OR length(description) <= 500),
  icon              TEXT             CHECK (icon       IS NULL OR length(icon)       <= 32),
  color             TEXT    NOT NULL CHECK (color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),

  -- Frecuencia polimórfica: cada modo exige sus propias columnas
  frequency_type    TEXT    NOT NULL CHECK (frequency_type IN ('daily','weekly','interval')),
  target_per_period INTEGER NOT NULL DEFAULT 1 CHECK (target_per_period > 0 AND target_per_period <= 7),
  interval_days     INTEGER          CHECK (interval_days IS NULL OR interval_days BETWEEN 1 AND 365),
  days_of_week      TEXT             CHECK (days_of_week  IS NULL OR json_valid(days_of_week)),

  sort_order        INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL,
  archived_at       TEXT             CHECK (archived_at IS NULL OR archived_at >= created_at),

  -- Coherencia polimórfica de la frecuencia. SQLite exige que los CHECK
  -- de tabla estén al final, sin coma, y sin líneas en blanco dentro.
  CHECK (
    (frequency_type = 'daily'    AND interval_days IS NULL AND days_of_week IS NULL) OR
    (frequency_type = 'weekly'   AND interval_days IS NULL AND days_of_week IS NOT NULL) OR
    (frequency_type = 'interval' AND interval_days IS NOT NULL AND days_of_week IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_habits_archived ON habits(archived_at);
CREATE INDEX IF NOT EXISTS idx_habits_sort     ON habits(sort_order) WHERE archived_at IS NULL;

-- Logs: check-ins diarios (un hábito puede tener 1 log por día)
CREATE TABLE IF NOT EXISTS habit_logs (
  id            TEXT    PRIMARY KEY,
  habit_id      TEXT    NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  log_date      TEXT    NOT NULL CHECK (log_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  completed_at  TEXT    NOT NULL,
  note          TEXT             CHECK (note IS NULL OR length(note) <= 280),
  created_at    TEXT    NOT NULL,

  UNIQUE (habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS idx_logs_habit_date ON habit_logs(habit_id, log_date DESC);
CREATE INDEX IF NOT EXISTS idx_logs_date       ON habit_logs(log_date DESC);
