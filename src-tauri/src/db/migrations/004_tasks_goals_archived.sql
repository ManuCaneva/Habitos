-- Migración 004: Agregar archived_at a tasks y goals
-- Patrón idéntico a habits (001_init.sql)

ALTER TABLE tasks ADD COLUMN archived_at TEXT CHECK (archived_at IS NULL OR archived_at >= created_at);
ALTER TABLE goals ADD COLUMN archived_at TEXT CHECK (archived_at IS NULL OR archived_at >= created_at);

CREATE INDEX IF NOT EXISTS idx_tasks_archived ON tasks(archived_at);
CREATE INDEX IF NOT EXISTS idx_tasks_sort_active ON tasks(sort_order) WHERE archived_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_goals_archived ON goals(archived_at);
CREATE INDEX IF NOT EXISTS idx_goals_sort_active ON goals(sort_order) WHERE archived_at IS NULL;
