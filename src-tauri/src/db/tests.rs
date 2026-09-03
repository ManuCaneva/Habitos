use super::*;
use rusqlite::Connection;

fn fixture_token(conn: &Connection) -> String {
    conn.query_row("SELECT lower(hex(randomblob(16)))", [], |row| row.get(0))
        .expect("generate fixture token")
}

fn fixture_timestamp() -> String {
    now_iso8601()
}

fn fixture_date(timestamp: &str) -> &str {
    &timestamp[..10]
}

fn fixture_color() -> String {
    "#112233".to_owned()
}

fn record_versions(conn: &Connection, through: i64) {
    for version in 1..=through {
        conn.execute(
            "INSERT INTO schema_version (version, applied_at) VALUES (?1, 'test')",
            [version],
        )
        .expect("record migration version");
    }
}

fn legacy_db() -> (Db, String, String, String) {
    let conn = Connection::open_in_memory().expect("open in-memory database");
    conn.execute_batch(include_str!("migrations/001_init.sql"))
        .expect("create legacy schema");
    let habit_id = fixture_token(&conn);
    let habit_name = fixture_token(&conn);
    let color = fixture_color();
    let timestamp = fixture_timestamp();
    let log_id = fixture_token(&conn);
    let log_timestamp = fixture_timestamp();
    let note = fixture_token(&conn);
    conn.execute(
        "INSERT INTO habits (
            id, name, color, frequency_type, target_per_period,
            interval_days, days_of_week, sort_order, created_at, updated_at
         ) VALUES (?1, ?2, ?3, 'daily', ?4, NULL, NULL, 0, ?5, ?5)",
        (&habit_id, &habit_name, &color, 7, &timestamp),
    )
    .expect("insert legacy habit");
    conn.execute(
        "INSERT INTO habit_logs (
            id, habit_id, log_date, completed_at, note, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?4)",
        (
            &log_id,
            &habit_id,
            fixture_date(&log_timestamp),
            &log_timestamp,
            &note,
        ),
    )
    .expect("insert legacy log");
    record_versions(&conn, 9);
    let db = Db {
        conn: Mutex::new(conn),
    };
    (db, habit_id, log_id, note)
}

#[test]
fn repairs_schema_and_preserves_existing_data_and_relations() {
    let (db, habit_id, log_id, note) = legacy_db();
    db.run_migrations().expect("repair stale schema");
    let conn = db.conn.lock().unwrap();

    let count_definition: (String, i64, String) = conn
        .query_row(
            "SELECT type, \"notnull\", COALESCE(dflt_value, '')
             FROM pragma_table_info('habit_logs') WHERE name = 'count'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .expect("inspect count definition");
    assert_eq!(count_definition, ("INTEGER".to_owned(), 1, "1".to_owned()));

    let count_check: String = conn
        .query_row(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'habit_logs'",
            [],
            |row| row.get(0),
        )
        .expect("inspect log constraints");
    assert!(count_check.contains("count >= 1"));

    let target: i64 = conn
        .query_row(
            "SELECT target_per_period FROM habits WHERE id = ?1",
            [&habit_id],
            |row| row.get(0),
        )
        .expect("find preserved habit");
    assert_eq!(target, 7);

    let preserved_log: (String, i64) = conn
        .query_row(
            "SELECT note, count FROM habit_logs WHERE id = ?1",
            [&log_id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .expect("find preserved log");
    assert_eq!(preserved_log, (note, 1));

    let foreign_key_target: String = conn
        .query_row(
            "SELECT \"table\" FROM pragma_foreign_key_list('habit_logs') WHERE \"from\" = 'habit_id'",
            [],
            |row| row.get(0),
        )
        .expect("inspect habit log foreign key");
    assert_eq!(foreign_key_target, "habits");

    conn.execute("DELETE FROM habits WHERE id = ?1", [&habit_id])
        .expect("delete preserved habit");
    let remaining_logs: i64 = conn
        .query_row(
            "SELECT count(*) FROM habit_logs WHERE id = ?1",
            [&log_id],
            |row| row.get(0),
        )
        .expect("count cascaded logs");
    assert_eq!(remaining_logs, 0);
}

#[test]
fn does_not_rebuild_a_schema_that_accepts_target_twenty() {
    let conn = Connection::open_in_memory().expect("open in-memory database");
    conn.execute_batch(
        "CREATE TABLE schema_version (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
         CREATE TABLE habits (
           id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL,
           frequency_type TEXT NOT NULL,
           target_per_period INTEGER NOT NULL CHECK(target_per_period>0 AND target_per_period<=20),
           interval_days INTEGER, days_of_week TEXT, sort_order INTEGER NOT NULL,
           created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT
         );
         CREATE TABLE habit_logs (
           id TEXT PRIMARY KEY, habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
           log_date TEXT NOT NULL, completed_at TEXT NOT NULL, note TEXT,
           count INTEGER NOT NULL DEFAULT 1 CHECK(count>=1), created_at TEXT NOT NULL
         );
          ;",
    )
    .expect("create semantically valid schema");
    let habit_id = fixture_token(&conn);
    let timestamp = fixture_timestamp();
    let habit_name = fixture_token(&conn);
    let color = fixture_color();
    conn.execute(
        "INSERT INTO habits VALUES (?1, ?2, ?3, 'daily', 20, NULL, NULL, 0, ?4, ?4, NULL)",
        (&habit_id, &habit_name, &color, &timestamp),
    )
    .expect("insert valid-schema fixture");
    record_versions(&conn, 9);
    let before: String = conn
        .query_row(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'habits'",
            [],
            |row| row.get(0),
        )
        .expect("inspect schema before repair");

    let db = Db {
        conn: Mutex::new(conn),
    };
    db.run_migrations().expect("validate progressive schema");
    let conn = db.conn.lock().unwrap();
    let after: String = conn
        .query_row(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'habits'",
            [],
            |row| row.get(0),
        )
        .expect("inspect schema after repair");
    assert_eq!(after, before);
}

#[test]
fn repairs_an_existing_malformed_count_column() {
    let conn = Connection::open_in_memory().expect("open in-memory database");
    conn.pragma_update(None, "foreign_keys", "ON")
        .expect("enable foreign keys");
    conn.execute_batch(
        "CREATE TABLE schema_version (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
         CREATE TABLE habits (
           id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL,
           frequency_type TEXT NOT NULL,
           target_per_period INTEGER NOT NULL CHECK(target_per_period > 0 AND target_per_period <= 20),
           interval_days INTEGER, days_of_week TEXT, sort_order INTEGER NOT NULL,
           created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT
         );
         CREATE TABLE habit_logs (
           id TEXT PRIMARY KEY, habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
           log_date TEXT NOT NULL, completed_at TEXT NOT NULL, note TEXT,
           count TEXT, created_at TEXT NOT NULL,
           UNIQUE (habit_id, log_date)
         );
         INSERT INTO habits VALUES (
           lower(hex(randomblob(16))), 'fixture habit', '#123456', 'daily', 20,
           NULL, NULL, 0, '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', NULL
         );
         INSERT INTO habit_logs
            SELECT lower(hex(randomblob(16))), id, '2020-01-02',
                   '2020-01-02T00:00:00.000Z', NULL, '2', '2020-01-02T00:00:00.000Z'
            FROM habits;",
    )
    .expect("create malformed schema");
    conn.execute(
        "INSERT INTO habit_logs
         SELECT lower(hex(randomblob(16))), id, '2020-01-03',
                '2020-01-03T00:00:00.000Z', NULL, '2abc', '2020-01-03T00:00:00.000Z'
         FROM habits",
        [],
    )
    .expect("insert partially numeric count");
    record_versions(&conn, 9);

    let db = Db {
        conn: Mutex::new(conn),
    };
    db.run_migrations().expect("repair malformed count");
    let conn = db.conn.lock().unwrap();

    let count_definition: (i64, String) = conn
        .query_row(
            "SELECT \"notnull\", COALESCE(dflt_value, '')
             FROM pragma_table_info('habit_logs') WHERE name = 'count'",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .expect("inspect repaired count");
    assert_eq!(count_definition, (1, "1".to_owned()));

    let count: i64 = conn
        .query_row(
            "SELECT count FROM habit_logs WHERE log_date = '2020-01-02'",
            [],
            |row| row.get(0),
        )
        .expect("read normalized count");
    assert_eq!(count, 2);

    let invalid_count: i64 = conn
        .query_row(
            "SELECT count FROM habit_logs WHERE log_date = '2020-01-03'",
            [],
            |row| row.get(0),
        )
        .expect("read invalid count normalization");
    assert_eq!(invalid_count, 1);
}

#[test]
fn normalizes_invalid_values_in_a_canonical_count_column() {
    let conn = Connection::open_in_memory().expect("open in-memory database");
    conn.pragma_update(None, "foreign_keys", "ON")
        .expect("enable foreign keys");
    conn.execute_batch(
        "CREATE TABLE schema_version (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
         CREATE TABLE habits (
           id TEXT PRIMARY KEY, name TEXT NOT NULL, color TEXT NOT NULL,
           frequency_type TEXT NOT NULL,
           target_per_period INTEGER NOT NULL CHECK(target_per_period > 0 AND target_per_period <= 20),
           interval_days INTEGER, days_of_week TEXT, sort_order INTEGER NOT NULL,
           created_at TEXT NOT NULL, updated_at TEXT NOT NULL, archived_at TEXT
         );
         CREATE TABLE habit_logs (
           id TEXT PRIMARY KEY, habit_id TEXT NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
           log_date TEXT NOT NULL, completed_at TEXT NOT NULL, note TEXT,
           count INTEGER NOT NULL DEFAULT 1 CHECK(count >= 1), created_at TEXT NOT NULL,
           UNIQUE (habit_id, log_date)
         );
         INSERT INTO habits VALUES (
           lower(hex(randomblob(16))), 'fixture habit', '#123456', 'daily', 20,
           NULL, NULL, 0, '2020-01-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z', NULL
         );
         INSERT INTO habit_logs
           SELECT lower(hex(randomblob(16))), id, '2020-01-02',
                  '2020-01-02T00:00:00.000Z', NULL, '2abc', '2020-01-02T00:00:00.000Z'
           FROM habits;",
    )
    .expect("create canonical schema with malformed value");
    record_versions(&conn, 9);

    let db = Db {
        conn: Mutex::new(conn),
    };
    db.run_migrations()
        .expect("normalize canonical count values");
    let conn = db.conn.lock().unwrap();
    let count: i64 = conn
        .query_row("SELECT count FROM habit_logs", [], |row| row.get(0))
        .expect("read normalized count");
    assert_eq!(count, 1);
}
