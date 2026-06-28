// =============================================================
// lib.rs — Entry point + setup de Tauri
// =============================================================

mod commands;
mod db;

use db::Db;
use std::path::PathBuf;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Persistir la DB en el app_data_dir multiplataforma.
            let dir: PathBuf = app
                .path()
                .app_data_dir()
                .expect("no se pudo resolver app_data_dir");
            let db_path = dir.join("habitos.sqlite");
            let database = Db::open(&db_path).expect("error inicializando SQLite");
            app.manage(database);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::habits::create_habit,
            commands::habits::list_habits,
            commands::habits::update_habit,
            commands::habits::archive_habit,
            commands::habits::restore_habit,
            commands::logs::create_log,
            commands::logs::delete_log,
            commands::logs::list_logs_in_range,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
