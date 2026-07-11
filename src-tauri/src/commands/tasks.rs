use crate::db::{Db, DbError, DbResult, IntoStringErr};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskInput {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub description: Option<String>,
    pub color: String,
    pub status: String,
    #[serde(default)]
    pub due_date: Option<String>,
    #[serde(default = "default_steps")]
    pub steps: String,
    #[serde(default)]
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

fn default_steps() -> String {
    "[]".to_string()
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateTaskInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<Option<String>>,
    pub color: Option<String>,
    pub status: Option<String>,
    pub due_date: Option<Option<String>>,
    pub steps: Option<String>,
    pub sort_order: Option<i32>,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct TaskRow {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub color: String,
    pub status: String,
    pub due_date: Option<String>,
    pub steps: String,
    pub sort_order: i32,
    pub created_at: String,
    pub updated_at: String,
}

fn row_to_task(r: &rusqlite::Row<'_>) -> rusqlite::Result<TaskRow> {
    Ok(TaskRow {
        id: r.get("id")?,
        title: r.get("title")?,
        description: r.get("description")?,
        color: r.get("color")?,
        status: r.get("status")?,
        due_date: r.get("due_date")?,
        steps: r.get("steps")?,
        sort_order: r.get("sort_order")?,
        created_at: r.get("created_at")?,
        updated_at: r.get("updated_at")?,
    })
}

#[tauri::command]
pub fn create_task(db: State<'_, Db>, input: CreateTaskInput) -> Result<TaskRow, String> {
    let result: DbResult<TaskRow> = (|| {
        let conn = db.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO tasks (id, title, description, color, status, due_date, steps, sort_order, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                input.id,
                input.title,
                input.description,
                input.color,
                input.status,
                input.due_date,
                input.steps,
                input.sort_order,
                input.created_at,
                input.updated_at,
            ],
        )?;

        let row = conn
            .query_row("SELECT * FROM tasks WHERE id = ?1", params![input.id], row_to_task)
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn list_tasks(db: State<'_, Db>) -> Result<Vec<TaskRow>, String> {
    let result: DbResult<Vec<TaskRow>> = (|| {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT * FROM tasks ORDER BY sort_order ASC, created_at ASC")?;
        let rows = stmt.query_map([], row_to_task)?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn update_task(db: State<'_, Db>, input: UpdateTaskInput) -> Result<TaskRow, String> {
    let result: DbResult<TaskRow> = (|| {
        let conn = db.conn.lock().unwrap();

        conn.execute(
            "UPDATE tasks SET
                title       = COALESCE(?2, title),
                description = CASE WHEN ?3 = 1 THEN ?4 ELSE description END,
                color       = COALESCE(?5, color),
                status      = COALESCE(?6, status),
                due_date    = CASE WHEN ?7 = 1 THEN ?8 ELSE due_date END,
                steps       = COALESCE(?9, steps),
                sort_order  = COALESCE(?10, sort_order),
                updated_at  = ?11
             WHERE id = ?1",
            params![
                input.id,
                input.title,
                input.description.is_some() as i32,
                input.description.flatten(),
                input.color,
                input.status,
                input.due_date.is_some() as i32,
                input.due_date.flatten(),
                input.steps,
                input.sort_order,
                input.updated_at,
            ],
        )?;

        let row = conn
            .query_row("SELECT * FROM tasks WHERE id = ?1", params![input.id], row_to_task)
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn delete_task(db: State<'_, Db>, id: String) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        let n = conn.execute("DELETE FROM tasks WHERE id = ?1", params![id])?;
        if n == 0 {
            return Err(DbError::NotFound);
        }
        Ok(())
    })();
    result.to_str_err()
}
