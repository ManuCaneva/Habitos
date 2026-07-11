use crate::db::{Db, DbError, DbResult, IntoStringErr};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct UpsertGoalLogInput {
    pub id: String,
    pub goal_id: String,
    pub log_date: String,
    pub amount: i32,
    #[serde(default)]
    pub note: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize)]
pub struct GoalLogRow {
    pub id: String,
    pub goal_id: String,
    pub log_date: String,
    pub amount: i32,
    pub note: Option<String>,
    pub created_at: String,
}

fn row_to_goal_log(r: &rusqlite::Row<'_>) -> rusqlite::Result<GoalLogRow> {
    Ok(GoalLogRow {
        id: r.get("id")?,
        goal_id: r.get("goal_id")?,
        log_date: r.get("log_date")?,
        amount: r.get("amount")?,
        note: r.get("note")?,
        created_at: r.get("created_at")?,
    })
}

#[tauri::command]
pub fn upsert_goal_log(db: State<'_, Db>, input: UpsertGoalLogInput) -> Result<GoalLogRow, String> {
    let result: DbResult<GoalLogRow> = (|| {
        let conn = db.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO goal_logs (id, goal_id, log_date, amount, note, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(goal_id, log_date) DO UPDATE SET
                amount = excluded.amount,
                note   = excluded.note",
            params![
                input.id,
                input.goal_id,
                input.log_date,
                input.amount,
                input.note,
                input.created_at,
            ],
        )?;

        let row = conn
            .query_row(
                "SELECT * FROM goal_logs WHERE goal_id = ?1 AND log_date = ?2",
                params![input.goal_id, input.log_date],
                row_to_goal_log,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn delete_goal_log(db: State<'_, Db>, id: String) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        let n = conn.execute("DELETE FROM goal_logs WHERE id = ?1", params![id])?;
        if n == 0 {
            return Err(DbError::NotFound);
        }
        Ok(())
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn list_goal_logs_in_range(
    db: State<'_, Db>,
    goal_id: Option<String>,
    from_date: String,
    to_date: String,
) -> Result<Vec<GoalLogRow>, String> {
    let result: DbResult<Vec<GoalLogRow>> = (|| {
        let conn = db.conn.lock().unwrap();

        let mut sql = String::from(
            "SELECT * FROM goal_logs WHERE log_date >= ?1 AND log_date <= ?2",
        );
        let mut args: Vec<Box<dyn rusqlite::ToSql>> = vec![
            Box::new(from_date),
            Box::new(to_date),
        ];

        if let Some(ref gid) = goal_id {
            sql.push_str(" AND goal_id = ?3");
            args.push(Box::new(gid.clone()));
        }

        sql.push_str(" ORDER BY log_date DESC");

        let mut stmt = conn.prepare(&sql)?;
        let params_refs: Vec<&dyn rusqlite::ToSql> = args.iter().map(|a| a.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), row_to_goal_log)?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
    })();
    result.to_str_err()
}
