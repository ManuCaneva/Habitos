-- Migration 003: tasks, goals, goal_logs tables

-- Tasks table
CREATE TABLE tasks (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 100),
  description TEXT CHECK(length(description) <= 500),
  color       TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  status      TEXT NOT NULL CHECK(status IN ('todo','doing','done')),
  due_date    TEXT CHECK(due_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  steps       TEXT NOT NULL CHECK(json_valid(steps)) DEFAULT '[]',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

CREATE INDEX idx_tasks_status ON tasks(status) WHERE status != 'done';
CREATE INDEX idx_tasks_due    ON tasks(due_date);
CREATE INDEX idx_tasks_sort   ON tasks(sort_order);

-- Goals table
CREATE TABLE goals (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 100),
  description    TEXT CHECK(length(description) <= 500),
  color          TEXT NOT NULL CHECK(color GLOB '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
  target         INTEGER NOT NULL CHECK(target > 0),
  unit           TEXT CHECK(length(unit) <= 20),
  frequency_type TEXT NOT NULL CHECK(frequency_type IN ('daily','weekly','interval')),
  interval_days  INTEGER CHECK(interval_days IS NULL OR (interval_days BETWEEN 1 AND 365)),
  days_of_week   TEXT CHECK(days_of_week IS NULL OR json_valid(days_of_week)),
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL,
  CHECK((frequency_type = 'daily'   AND interval_days IS NULL AND days_of_week IS NULL)
     OR (frequency_type = 'weekly'   AND interval_days IS NULL AND days_of_week IS NOT NULL)
     OR (frequency_type = 'interval' AND interval_days IS NOT NULL AND days_of_week IS NULL))
);

CREATE INDEX idx_goals_sort ON goals(sort_order);

-- Goal logs table
CREATE TABLE goal_logs (
  id         TEXT PRIMARY KEY,
  goal_id    TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  log_date   TEXT NOT NULL CHECK(log_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  amount     INTEGER NOT NULL CHECK(amount > 0),
  note       TEXT CHECK(note IS NULL OR length(note) <= 280),
  created_at TEXT NOT NULL,
  UNIQUE(goal_id, log_date)
);

CREATE INDEX idx_goal_logs_date   ON goal_logs(goal_id, log_date DESC);
CREATE INDEX idx_goal_logs_recent ON goal_logs(log_date DESC);
