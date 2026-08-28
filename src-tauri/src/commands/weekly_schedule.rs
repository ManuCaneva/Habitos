use crate::db::{Db, DbError, DbResult, IntoStringErr};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateScheduleBlockInput {
    pub id: String,
    pub title: String,
    pub color: String,
    #[serde(default)]
    pub sort_order: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateScheduleBlockInput {
    pub id: String,
    pub title: Option<String>,
    pub color: Option<String>,
    pub sort_order: Option<f64>,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateScheduleSlotInput {
    pub id: String,
    pub block_id: String,
    pub day_of_week: i32,
    pub start_minutes: i32,
    pub end_minutes: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateScheduleSlotInput {
    pub id: String,
    pub day_of_week: Option<i32>,
    pub start_minutes: Option<i32>,
    pub end_minutes: Option<i32>,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScheduleBlockRow {
    pub id: String,
    pub title: String,
    pub color: String,
    pub sort_order: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ScheduleSlotRow {
    pub id: String,
    pub block_id: String,
    pub day_of_week: i32,
    pub start_minutes: i32,
    pub end_minutes: i32,
    pub created_at: String,
    pub updated_at: String,
}

fn row_to_block(r: &rusqlite::Row<'_>) -> rusqlite::Result<ScheduleBlockRow> {
    Ok(ScheduleBlockRow {
        id: r.get("id")?,
        title: r.get("title")?,
        color: r.get("color")?,
        sort_order: r.get("sort_order")?,
        created_at: r.get("created_at")?,
        updated_at: r.get("updated_at")?,
    })
}

fn row_to_slot(r: &rusqlite::Row<'_>) -> rusqlite::Result<ScheduleSlotRow> {
    Ok(ScheduleSlotRow {
        id: r.get("id")?,
        block_id: r.get("block_id")?,
        day_of_week: r.get("day_of_week")?,
        start_minutes: r.get("start_minutes")?,
        end_minutes: r.get("end_minutes")?,
        created_at: r.get("created_at")?,
        updated_at: r.get("updated_at")?,
    })
}

#[tauri::command]
pub fn list_schedule_blocks(db: State<'_, Db>) -> Result<Vec<ScheduleBlockRow>, String> {
    let result: DbResult<Vec<ScheduleBlockRow>> = (|| {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, color, sort_order, created_at, updated_at
             FROM schedule_blocks ORDER BY sort_order ASC, created_at ASC",
        )?;
        let rows = stmt.query_map([], row_to_block)?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn list_schedule_slots(db: State<'_, Db>) -> Result<Vec<ScheduleSlotRow>, String> {
    let result: DbResult<Vec<ScheduleSlotRow>> = (|| {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, block_id, day_of_week, start_minutes, end_minutes, created_at, updated_at
             FROM schedule_block_slots ORDER BY day_of_week ASC, start_minutes ASC",
        )?;
        let rows = stmt.query_map([], row_to_slot)?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn create_schedule_block(
    db: State<'_, Db>,
    input: CreateScheduleBlockInput,
) -> Result<ScheduleBlockRow, String> {
    let result: DbResult<ScheduleBlockRow> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO schedule_blocks
               (id, title, color, sort_order, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                input.id,
                input.title,
                input.color,
                input.sort_order,
                input.created_at,
                input.updated_at,
            ],
        )?;
        let row = conn
            .query_row(
                "SELECT id, title, color, sort_order, created_at, updated_at FROM schedule_blocks WHERE id = ?1",
                params![input.id],
                row_to_block,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn create_schedule_slot(
    db: State<'_, Db>,
    input: CreateScheduleSlotInput,
) -> Result<ScheduleSlotRow, String> {
    let result: DbResult<ScheduleSlotRow> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO schedule_block_slots
               (id, block_id, day_of_week, start_minutes, end_minutes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                input.id,
                input.block_id,
                input.day_of_week,
                input.start_minutes,
                input.end_minutes,
                input.created_at,
                input.updated_at,
            ],
        )?;
        let row = conn
            .query_row(
                "SELECT id, block_id, day_of_week, start_minutes, end_minutes, created_at, updated_at FROM schedule_block_slots WHERE id = ?1",
                params![input.id],
                row_to_slot,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn update_schedule_block(
    db: State<'_, Db>,
    input: UpdateScheduleBlockInput,
) -> Result<ScheduleBlockRow, String> {
    let result: DbResult<ScheduleBlockRow> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "UPDATE schedule_blocks SET
               title        = COALESCE(?2, title),
               color        = COALESCE(?3, color),
               sort_order   = COALESCE(?4, sort_order),
               updated_at   = ?5
             WHERE id = ?1",
            params![
                input.id,
                input.title,
                input.color,
                input.sort_order,
                input.updated_at,
            ],
        )?;
        let row = conn
            .query_row(
                "SELECT id, title, color, sort_order, created_at, updated_at FROM schedule_blocks WHERE id = ?1",
                params![input.id],
                row_to_block,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn update_schedule_slot(
    db: State<'_, Db>,
    input: UpdateScheduleSlotInput,
) -> Result<ScheduleSlotRow, String> {
    let result: DbResult<ScheduleSlotRow> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "UPDATE schedule_block_slots SET
               day_of_week  = COALESCE(?2, day_of_week),
               start_minutes = COALESCE(?3, start_minutes),
               end_minutes  = COALESCE(?4, end_minutes),
               updated_at   = ?5
             WHERE id = ?1",
            params![
                input.id,
                input.day_of_week,
                input.start_minutes,
                input.end_minutes,
                input.updated_at,
            ],
        )?;
        let row = conn
            .query_row(
                "SELECT id, block_id, day_of_week, start_minutes, end_minutes, created_at, updated_at FROM schedule_block_slots WHERE id = ?1",
                params![input.id],
                row_to_slot,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn delete_schedule_block(db: State<'_, Db>, id: String) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute("DELETE FROM schedule_blocks WHERE id = ?1", params![id])?;
        Ok(())
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn delete_schedule_slot(db: State<'_, Db>, id: String) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM schedule_block_slots WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    })();
    result.to_str_err()
}
