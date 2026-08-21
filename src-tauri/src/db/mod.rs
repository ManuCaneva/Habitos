// =============================================================
// db/mod.rs — Inicialización de SQLite + migraciones
// Rust es solo I/O. Cero lógica de negocio acá.
// =============================================================

use rusqlite::{params, Connection};
use std::path::Path;
use std::sync::Mutex;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DbError {
    #[error("sqlite error: {0}")]
    Sqlite(#[from] rusqlite::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("migration failed: {0}")]
    Migration(String),
    #[error("not found")]
    NotFound,
}

pub type DbResult<T> = Result<T, DbError>;

// Helper: convierte cualquier DbError a String para retornar desde
// #[tauri::command] (Tauri 2 acepta Result<T, String> out-of-the-box).
impl From<DbError> for String {
    fn from(e: DbError) -> Self {
        e.to_string()
    }
}

/// Extensión para terminar los commands con `.to_str_err()` en vez de
/// `.map_err(|e| e.to_string())` repetido en cada uno.
pub trait IntoStringErr<T> {
    fn to_str_err(self) -> Result<T, String>;
}

impl<T> IntoStringErr<T> for DbResult<T> {
    fn to_str_err(self) -> Result<T, String> {
        self.map_err(|e| e.to_string())
    }
}

// Pool minimalista: un solo Mutex<Connection> por instancia de la app.
// Suficiente para Tauri (single-window desktop app, sin concurrencia masiva).
pub struct Db {
    pub conn: Mutex<Connection>,
}

impl Db {
    pub fn open(path: &Path) -> DbResult<Self> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        Self::migrate_legacy_db_filename(path)?;
        let conn = Connection::open(path)?;
        // WAL: mejor concurrencia lectura/escritura. Foreign keys ON para ON DELETE CASCADE.
        conn.pragma_update(None, "journal_mode", "WAL")?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        let db = Self { conn: Mutex::new(conn) };
        db.run_migrations()?;
        Ok(db)
    }

    #[allow(dead_code)] // usado en tests de integración
    pub fn open_in_memory() -> DbResult<Self> {
        let conn = Connection::open_in_memory()?;
        conn.pragma_update(None, "foreign_keys", "ON")?;
        let db = Self { conn: Mutex::new(conn) };
        db.run_migrations()?;
        Ok(db)
    }

    /// Renombra la DB legada con el nombre viejo ("habitos.sqlite") al
    /// nombre actual ("aeon.sqlite") la primera vez, conservando la data.
    /// También mueve los archivos WAL/SHM asociados si existen. Es una
    /// migración de identidad del archivo, no de esquema.
    fn migrate_legacy_db_filename(path: &Path) -> DbResult<()> {
        let file_name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("aeon.sqlite");
        // Solo aplica para el nombre canónico de producción.
        if file_name != "aeon.sqlite" {
            return Ok(());
        }
        let dir = path.parent().unwrap_or_else(|| Path::new("."));
        let new_path = dir.join("aeon.sqlite");
        if new_path.exists() {
            return Ok(()); // ya migrado
        }
        let legacy = dir.join("habitos.sqlite");
        if !legacy.exists() {
            return Ok(()); // no hay nada que migrar
        }
        std::fs::rename(&legacy, &new_path)?;
        // Mueve sidecar WAL/SHM si quedaron (renombre mantiene coherencia).
        for ext in ["-wal", "-shm"] {
            let from = dir.join(format!("habitos.sqlite{ext}"));
            if from.exists() {
                let _ = std::fs::rename(&from, dir.join(format!("aeon.sqlite{ext}")));
            }
        }
        Ok(())
    }

    fn run_migrations(&self) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version    INTEGER PRIMARY KEY,
                applied_at TEXT    NOT NULL
             );",
        )
        .map_err(|e| DbError::Migration(format!("schema_version: {e}")))?;

        let migrations: [(i64, &str, &str); 7] = [
            (1, "001_init", include_str!("migrations/001_init.sql")),
            (2, "002_config", include_str!("migrations/002_config.sql")),
            (3, "003_tasks_goals", include_str!("migrations/003_tasks_goals.sql")),
            (4, "004_tasks_goals_archived", include_str!("migrations/004_tasks_goals_archived.sql")),
            (5, "005_weekly_schedule", include_str!("migrations/005_weekly_schedule.sql")),
            (6, "006_block_slots", ""), // Migración 006 se ejecuta en Rust (run_migration_006)
            (7, "007_aeon_storage_keys", ""), // Migración 007 se ejecuta en Rust (run_migration_007)
        ];

        for (version, name, sql) in &migrations {
            let already_applied: bool = conn
                .query_row(
                    "SELECT EXISTS(SELECT 1 FROM schema_version WHERE version = ?1)",
                    params![version],
                    |r| r.get(0),
                )
                .unwrap_or(false);

            if !already_applied {
                // Para migraciones 006/007, manejar por lógica Rust (rutas parciales)
                if *version == 6 {
                    Self::run_migration_006(&conn)?;
                    conn.execute(
                        "INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (?1, ?2)",
                        params![version, now_iso8601()],
                    )?;
                } else if *version == 7 {
                    Self::run_migration_007(&conn)?;
                    conn.execute(
                        "INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (?1, ?2)",
                        params![version, now_iso8601()],
                    )?;
                } else {
                    conn.execute_batch(sql)
                        .map_err(|e| DbError::Migration(format!("{name}.sql: {e}")))?;
                    conn.execute(
                        "INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (?1, ?2)",
                        params![version, now_iso8601()],
                    )?;
                }
            }
        }

        Ok(())
    }

    fn run_migration_006(conn: &Connection) -> DbResult<()> {
        // Migración robusta con transacción para atomicidad
        conn.execute_batch("BEGIN TRANSACTION;")
            .map_err(|e| DbError::Migration(format!("006: begin transaction: {e}")))?;

        let result = (|| -> DbResult<()> {
            // Verificar si la tabla schedule_block_slots existe
            let slots_table_exists: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='schedule_block_slots')",
                [],
                |r| r.get(0),
            )?;

            if !slots_table_exists {
                // Crear la tabla schedule_block_slots
                conn.execute_batch(
                    "CREATE TABLE schedule_block_slots (
                        id            TEXT PRIMARY KEY,
                        block_id      TEXT NOT NULL REFERENCES schedule_blocks(id) ON DELETE CASCADE,
                        day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
                        start_minutes INTEGER NOT NULL CHECK (start_minutes >= 0 AND start_minutes < 1440),
                        end_minutes   INTEGER NOT NULL CHECK (end_minutes > 0 AND end_minutes <= 1440),
                        created_at    TEXT NOT NULL,
                        updated_at    TEXT NOT NULL,
                        CHECK (end_minutes > start_minutes)
                    );
                    CREATE INDEX idx_schedule_block_slots_block ON schedule_block_slots(block_id);
                    CREATE INDEX idx_schedule_block_slots_day ON schedule_block_slots(day_of_week);"
                ).map_err(|e| DbError::Migration(format!("006: crear tabla slots: {e}")))?;
            }

            // Verificar si schedule_blocks existe
            let blocks_table_exists: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='schedule_blocks')",
                [],
                |r| r.get(0),
            )?;

            if !blocks_table_exists {
                // schedule_blocks no existe, verificar si schedule_blocks_new existe (migración parcial)
                let new_table_exists: bool = conn.query_row(
                    "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='schedule_blocks_new')",
                    [],
                    |r| r.get(0),
                )?;

                if new_table_exists {
                    // Completar el rename
                    conn.execute_batch(
                        "ALTER TABLE schedule_blocks_new RENAME TO schedule_blocks;"
                    ).map_err(|e| DbError::Migration(format!("006: completar rename: {e}")))?;
                } else {
                    // Ni schedule_blocks ni schedule_blocks_new existen, crear desde cero
                    conn.execute_batch(
                        "CREATE TABLE schedule_blocks (
                            id            TEXT PRIMARY KEY,
                            title         TEXT NOT NULL,
                            color         TEXT NOT NULL,
                            sort_order    REAL NOT NULL DEFAULT 0,
                            created_at    TEXT NOT NULL,
                            updated_at    TEXT NOT NULL
                        );"
                    ).map_err(|e| DbError::Migration(format!("006: crear schedule_blocks: {e}")))?;
                }
                return Ok(());
            }

            // schedule_blocks existe, verificar si tiene las columnas viejas
            let has_old_columns: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM pragma_table_info('schedule_blocks') WHERE name='day_of_week')",
                [],
                |r| r.get(0),
            )?;

            if has_old_columns {
                // Migrar datos existentes de schedule_blocks a schedule_block_slots
                conn.execute_batch(
                    "INSERT OR IGNORE INTO schedule_block_slots (id, block_id, day_of_week, start_minutes, end_minutes, created_at, updated_at)
                     SELECT 
                       'slot-' || id as id,
                       id as block_id,
                       day_of_week,
                       start_minutes,
                       end_minutes,
                       created_at,
                       updated_at
                     FROM schedule_blocks;"
                ).map_err(|e| DbError::Migration(format!("006: migrar datos: {e}")))?;

                // Eliminar índice viejo
                conn.execute_batch("DROP INDEX IF EXISTS idx_schedule_blocks_day;")
                    .map_err(|e| DbError::Migration(format!("006: drop index: {e}")))?;

                // Verificar si schedule_blocks_new existe (migración parcial)
                let new_table_exists: bool = conn.query_row(
                    "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='schedule_blocks_new')",
                    [],
                    |r| r.get(0),
                )?;

                if !new_table_exists {
                    // Crear tabla nueva sin columnas viejas
                    conn.execute_batch(
                        "CREATE TABLE schedule_blocks_new (
                            id            TEXT PRIMARY KEY,
                            title         TEXT NOT NULL,
                            color         TEXT NOT NULL,
                            sort_order    REAL NOT NULL DEFAULT 0,
                            created_at    TEXT NOT NULL,
                            updated_at    TEXT NOT NULL
                        );
                        INSERT INTO schedule_blocks_new (id, title, color, sort_order, created_at, updated_at)
                        SELECT id, title, color, sort_order, created_at, updated_at
                        FROM schedule_blocks;
                        DROP TABLE schedule_blocks;
                        ALTER TABLE schedule_blocks_new RENAME TO schedule_blocks;"
                    ).map_err(|e| DbError::Migration(format!("006: recrear tabla: {e}")))?;
                } else {
                    // La tabla new existe pero no se completó el rename
                    conn.execute_batch(
                        "DROP TABLE IF EXISTS schedule_blocks;
                         ALTER TABLE schedule_blocks_new RENAME TO schedule_blocks;"
                    ).map_err(|e| DbError::Migration(format!("006: completar rename: {e}")))?;
                }
            }

            Ok(())
        })();

        match result {
            Ok(_) => {
                conn.execute_batch("COMMIT;")
                    .map_err(|e| DbError::Migration(format!("006: commit: {e}")))?;
                Ok(())
            }
            Err(e) => {
                conn.execute_batch("ROLLBACK;")
                    .map_err(|e2| DbError::Migration(format!("006: rollback failed: {e2}, original error: {e}")))?;
                Err(e)
            }
        }
    }

    /// Migración 007: renombra la clave de config del layout del dashboard
    /// ("habitos-dashboard-layout" -> "aeon-dashboard-layout") para quedar
    /// consistente con el rebranding a AEON. Idempotente: si la clave nueva
    /// ya existe, se prioriza la nueva y se descarta la legada; si solo
    /// existe la legada, se renombra; si no hay ninguna, no hace nada.
    /// También migra cualquier otra clave de config habitual con prefijo
    /// "habitos." del pasado (token de OAuth, settings) manteniendo la data.
    fn run_migration_007(conn: &Connection) -> DbResult<()> {
        conn.execute_batch("BEGIN TRANSACTION;")
            .map_err(|e| DbError::Migration(format!("007: begin transaction: {e}")))?;

        let result = (|| -> DbResult<()> {
            // Renombrar key de layout si la nueva no existe.
            let new_exists: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM config WHERE key = 'aeon-dashboard-layout')",
                [],
                |r| r.get(0),
            )?;

            let legacy_exists: bool = conn.query_row(
                "SELECT EXISTS(SELECT 1 FROM config WHERE key = 'habitos-dashboard-layout')",
                [],
                |r| r.get(0),
            )?;

            if legacy_exists && !new_exists {
                conn.execute(
                    "UPDATE config SET key = 'aeon-dashboard-layout' WHERE key = 'habitos-dashboard-layout'",
                    [],
                )?;
            }

            // Migrar las claves de config "habitos.*" a "aeon.*", si existen.
            // NO migra claves de localStorage (esas van en el frontend).
            let renames: &[(&str, &str)] = &[
                ("habitos.theme", "aeon.theme"),
                ("habitos.viewMode", "aeon.viewMode"),
                ("habitos.sidebarCollapsed", "aeon.sidebarCollapsed"),
                ("habitos-dashboard-layout", "aeon-dashboard-layout"),
            ];
            for (old_key, new_key) in renames {
                let new_key_exists: bool = conn.query_row(
                    "SELECT EXISTS(SELECT 1 FROM config WHERE key = ?1)",
                    params![new_key],
                    |r| r.get(0),
                )?;
                if !new_key_exists {
                    conn.execute(
                        "UPDATE config SET key = ?1 WHERE key = ?2",
                        params![new_key, old_key],
                    )?;
                }
            }

            Ok(())
        })();

        match result {
            Ok(_) => {
                conn.execute_batch("COMMIT;")
                    .map_err(|e| DbError::Migration(format!("007: commit failed: {e}")))?;
                Ok(())
            }
            Err(e) => {
                conn.execute_batch("ROLLBACK;")
                    .map_err(|e2| DbError::Migration(format!("007: rollback failed: {e2}, original error: {e}")))?;
                Err(e)
            }
        }
    }
}

// Helper: timestamp ISO 8601 UTC con milisegundos. Usado solo para
// marcar cuándo se aplicó una migración. El resto de timestamps los
// genera el frontend y los validamos con Zod.
fn now_iso8601() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let dur = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = dur.as_secs() as i64;
    let millis = dur.subsec_millis();

    // Date math manual (sin chrono) — UTC, formato 2026-06-27T14:30:00.000Z
    let days = secs.div_euclid(86_400);
    let secs_of_day = secs.rem_euclid(86_400);
    let hour = (secs_of_day / 3600) as u32;
    let minute = ((secs_of_day % 3600) / 60) as u32;
    let second = (secs_of_day % 60) as u32;

    let (y, m, d) = civil_from_days(days);
    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}.{:03}Z",
        y, m, d, hour, minute, second, millis
    )
}

// Howard Hinnant date algorithm — converts days-since-epoch to (y, m, d) UTC.
fn civil_from_days(z: i64) -> (i32, u32, u32) {
    let z = z + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = (z - era * 146_097) as u32; // [0, 146096]
    let yoe = (doe - doe / 1460 + doe / 36524 - doe / 146_096) / 365; // [0, 399]
    let y = yoe as i32 + (era * 400) as i32;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100); // [0, 365]
    let mp = (5 * doy + 2) / 153; // [0, 11]
    let d = doy - (153 * mp + 2) / 5 + 1; // [1, 31]
    let m = if mp < 10 { mp + 3 } else { mp - 9 }; // [1, 12]
    let y = if m <= 2 { y + 1 } else { y };
    (y, m, d)
}
