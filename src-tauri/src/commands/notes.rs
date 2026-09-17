use crate::db::{Db, DbError, DbResult, IntoStringErr};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateNoteInput {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub color: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateNoteInput {
    pub id: String,
    pub title: Option<Option<String>>,
    pub description: Option<Option<String>>,
    pub color: Option<String>,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct NoteRow {
    pub id: String,
    pub title: Option<String>,
    pub description: Option<String>,
    pub color: String,
    pub created_at: String,
    pub updated_at: String,
}

fn row_to_note(r: &rusqlite::Row<'_>) -> rusqlite::Result<NoteRow> {
    Ok(NoteRow {
        id: r.get("id")?,
        title: r.get("title")?,
        description: r.get("description")?,
        color: r.get("color")?,
        created_at: r.get("created_at")?,
        updated_at: r.get("updated_at")?,
    })
}

#[tauri::command]
pub fn create_note(db: State<'_, Db>, input: CreateNoteInput) -> Result<NoteRow, String> {
    let result: DbResult<NoteRow> = (|| {
        let conn = db.conn.lock().unwrap();

        conn.execute(
            "INSERT INTO notes (id, title, description, color, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                input.id,
                input.title,
                input.description,
                input.color,
                input.created_at,
                input.updated_at,
            ],
        )?;

        let row = conn
            .query_row(
                "SELECT * FROM notes WHERE id = ?1",
                params![input.id],
                row_to_note,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn list_notes(db: State<'_, Db>) -> Result<Vec<NoteRow>, String> {
    let result: DbResult<Vec<NoteRow>> = (|| {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare("SELECT * FROM notes ORDER BY created_at DESC")?;
        let rows = stmt.query_map([], row_to_note)?;
        let mut out = Vec::new();
        for r in rows {
            out.push(r?);
        }
        Ok(out)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn update_note(db: State<'_, Db>, input: UpdateNoteInput) -> Result<NoteRow, String> {
    let result: DbResult<NoteRow> = (|| {
        let conn = db.conn.lock().unwrap();

        conn.execute(
            "UPDATE notes SET
                title       = CASE WHEN ?2 = 1 THEN ?3 ELSE title END,
                description = CASE WHEN ?4 = 1 THEN ?5 ELSE description END,
                color       = COALESCE(?6, color),
                updated_at  = ?7
             WHERE id = ?1",
            params![
                input.id,
                input.title.is_some() as i32,
                input.title.flatten(),
                input.description.is_some() as i32,
                input.description.flatten(),
                input.color,
                input.updated_at,
            ],
        )?;

        let row = conn
            .query_row(
                "SELECT * FROM notes WHERE id = ?1",
                params![input.id],
                row_to_note,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn delete_note(db: State<'_, Db>, id: String) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        let n = conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
        if n == 0 {
            return Err(DbError::NotFound);
        }
        Ok(())
    })();
    result.to_str_err()
}
