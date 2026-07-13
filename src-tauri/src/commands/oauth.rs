use std::net::TcpListener;
use std::io::{Read, Write};
use tauri::{AppHandle, Emitter};

#[tauri::command]
pub fn start_oauth_server(app: AppHandle) -> Result<(), String> {
    std::thread::spawn(move || {
        let listener = match TcpListener::bind("127.0.0.1:14202") {
            Ok(l) => l,
            Err(e) => {
                eprintln!("Failed to bind OAuth server to 14202: {}", e);
                return;
            }
        };

        if let Ok((mut stream, _)) = listener.accept() {
            let mut buffer = [0; 2048];
            if let Ok(size) = stream.read(&mut buffer) {
                let request = String::from_utf8_lossy(&buffer[..size]);
                let first_line = request.lines().next().unwrap_or("");
                if first_line.starts_with("GET /oauth-callback") {
                    let url_parts: Vec<&str> = first_line.split_whitespace().collect();
                    if url_parts.len() > 1 {
                        let path_and_query = url_parts[1];
                        if let Some(query_idx) = path_and_query.find('?') {
                            let query = &path_and_query[query_idx + 1..];
                            let mut code = String::new();
                            let mut state = String::new();
                            for pair in query.split('&') {
                                let mut parts = pair.split('=');
                                if let (Some(k), Some(v)) = (parts.next(), parts.next()) {
                                    if k == "code" {
                                        code = v.to_string();
                                    } else if k == "state" {
                                        state = v.to_string();
                                    }
                                }
                            }
                            
                            let response_body = r#"
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <meta charset="utf-8">
                                    <title>¡Inicio de sesión completado!</title>
                                    <style>
                                        body {
                                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                                            display: flex;
                                            flex-direction: column;
                                            align-items: center;
                                            justify-content: center;
                                            height: 100vh;
                                            background: #121212;
                                            color: #ffffff;
                                            text-align: center;
                                            margin: 0;
                                            padding: 20px;
                                        }
                                        h1 { margin-bottom: 10px; font-size: 24px; font-weight: 600; }
                                        p { color: #a0a0a0; font-size: 16px; }
                                    </style>
                                </head>
                                <body>
                                    <h1>¡Inicio de sesión completado!</h1>
                                    <p>Ya podés cerrar esta pestaña del navegador y regresar a la aplicación.</p>
                                </body>
                                </html>
                            "#;
                            let response = format!(
                                "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                                response_body.len(),
                                response_body
                            );
                            let _ = stream.write_all(response.as_bytes());
                            let _ = stream.flush();

                            #[derive(Clone, serde::Serialize)]
                            struct Payload {
                                code: String,
                                state: String,
                            }
                            let _ = app.emit("oauth-callback", Payload { code, state });
                        }
                    }
                }
            }
        }
    });
    Ok(())
}
