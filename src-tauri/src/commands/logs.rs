// =============================================================
// commands/logs.rs — Check-ins diarios
// Solo I/O. Cálculo de rachas/porcentajes vive en TypeScript.
// =============================================================

use crate::db::{Db, DbError, DbResult, IntoStringErr};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateLogInput {
    pub id: String,
    pub habit_id: String,
    pub log_date: String,
    pub completed_at: String,
    #[serde(default)]
    pub note: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct HabitLogRow {
    pub id: String,
    pub habit_id: String,
    pub log_date: String,
    pub completed_at: String,
    pub note: Option<String>,
    pub created_at: String,
}

fn row_to_log(r: &rusqlite::Row<'_>) -> rusqlite::Result<HabitLogRow> {
    Ok(HabitLogRow {
        id: r.get("id")?,
        habit_id: r.get("habit_id")?,
        log_date: r.get("log_date")?,
        completed_at: r.get("completed_at")?,
        note: r.get("note")?,
        created_at: r.get("created_at")?,
    })
}

#[tauri::command]
pub fn create_log(db: State<'_, Db>, input: CreateLogInput) -> Result<HabitLogRow, String> {
    let result: DbResult<HabitLogRow> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO habit_logs (id, habit_id, log_date, completed_at, note, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                input.id,
                input.habit_id,
                input.log_date,
                input.completed_at,
                input.note,
                input.created_at,
            ],
        )?;
        let row = conn
            .query_row(
                "SELECT * FROM habit_logs WHERE id = ?1",
                params![input.id],
                row_to_log,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn delete_log(db: State<'_, Db>, id: String) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        let n = conn.execute("DELETE FROM habit_logs WHERE id = ?1", params![id])?;
        if n == 0 {
            return Err(DbError::NotFound);
        }
        Ok(())
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn list_logs_in_range(
    db: State<'_, Db>,
    habit_id: Option<String>,
    from_date: String,
    to_date: String,
) -> Result<Vec<HabitLogRow>, String> {
    let result: DbResult<Vec<HabitLogRow>> = (|| {
        let conn = db.conn.lock().unwrap();
        let (sql, params_vec): (&str, Vec<Box<dyn rusqlite::ToSql>>) = match habit_id {
            Some(hid) => (
                "SELECT * FROM habit_logs
                 WHERE habit_id = ?1 AND log_date BETWEEN ?2 AND ?3
                 ORDER BY log_date DESC",
                vec![
                    Box::new(hid),
                    Box::new(from_date),
                    Box::new(to_date),
                ],
            ),
            None => (
                "SELECT * FROM habit_logs
                 WHERE log_date BETWEEN ?1 AND ?2
                 ORDER BY log_date DESC",
                vec![Box::new(from_date), Box::new(to_date)],
            ),
        };

        let mut stmt = conn.prepare(sql)?;
        let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), row_to_log)?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
    })();
    result.to_str_err()
}
