use crate::db::{Db, DbResult, IntoStringErr};
use rusqlite::params;
use tauri::State;

#[tauri::command]
pub fn save_config(db: State<'_, Db>, key: String, value: String) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO config (key, value) VALUES (?1, ?2)",
            params![key, value],
        )?;
        Ok(())
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn load_config(db: State<'_, Db>, key: String) -> Result<Option<String>, String> {
    let result: DbResult<Option<String>> = (|| {
        let conn = db.conn.lock().unwrap();
        let value = conn
            .query_row(
                "SELECT value FROM config WHERE key = ?1",
                params![key],
                |r| r.get(0),
            )
            .ok();
        Ok(value)
    })();
    result.to_str_err()
}
