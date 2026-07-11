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

    fn run_migrations(&self) -> DbResult<()> {
        let conn = self.conn.lock().unwrap();

        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS schema_version (
                version    INTEGER PRIMARY KEY,
                applied_at TEXT    NOT NULL
             );",
        )
        .map_err(|e| DbError::Migration(format!("schema_version: {e}")))?;

        let migrations: [(i64, &str, &str); 3] = [
            (1, "001_init", include_str!("migrations/001_init.sql")),
            (2, "002_config", include_str!("migrations/002_config.sql")),
            (3, "003_tasks_goals", include_str!("migrations/003_tasks_goals.sql")),
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
                conn.execute_batch(sql)
                    .map_err(|e| DbError::Migration(format!("{name}.sql: {e}")))?;
                conn.execute(
                    "INSERT OR IGNORE INTO schema_version (version, applied_at) VALUES (?1, ?2)",
                    params![version, now_iso8601()],
                )?;
            }
        }

        Ok(())
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
