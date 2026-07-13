-- schedule_blocks: bloques de la plantilla semanal recurrente.
-- day_of_week: 0=Lunes .. 6=Domingo (ISO 8601, lun-comienzo).
-- start_minutes / end_minutes: minutos desde medianoche local (0..1440).

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id            TEXT PRIMARY KEY,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_minutes INTEGER NOT NULL CHECK (start_minutes >= 0 AND start_minutes < 1440),
  end_minutes   INTEGER NOT NULL CHECK (end_minutes > 0 AND end_minutes <= 1440),
  title         TEXT NOT NULL,
  color         TEXT NOT NULL,
  sort_order    REAL NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  CHECK (end_minutes > start_minutes)
);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_day ON schedule_blocks(day_of_week);
