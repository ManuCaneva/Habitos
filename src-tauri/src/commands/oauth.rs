use std::io::{Read, Write};
use std::net::TcpListener;
use tauri::{AppHandle, Emitter};

fn extract_path_and_query(request_line: &str) -> Option<&str> {
    let mut parts = request_line.split_whitespace();
    let method = parts.next()?;
    let target = parts.next()?;
    let version = parts.next()?;

    if method != "GET" || version != "HTTP/1.1" || parts.next().is_some() {
        return None;
    }

    if target.starts_with('/') && !target.contains('#') {
        Some(target)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::extract_path_and_query;

    #[test]
    fn extracts_get_path_with_raw_query() {
        assert_eq!(
            extract_path_and_query("GET /oauth-callback?code=4%2F0AV&state=a%2Bb HTTP/1.1"),
            Some("/oauth-callback?code=4%2F0AV&state=a%2Bb")
        );
    }

    #[test]
    fn extracts_get_path_without_query() {
        assert_eq!(
            extract_path_and_query("GET /oauth-callback HTTP/1.1"),
            Some("/oauth-callback")
        );
    }

    #[test]
    fn rejects_non_get_requests() {
        assert_eq!(
            extract_path_and_query("POST /oauth-callback?code=x HTTP/1.1"),
            None
        );
    }

    #[test]
    fn rejects_malformed_request_lines() {
        assert_eq!(extract_path_and_query("GET /oauth-callback"), None);
        assert_eq!(extract_path_and_query("GET HTTP/1.1"), None);
        assert_eq!(extract_path_and_query(""), None);
    }

    #[test]
    fn rejects_request_lines_without_http_version() {
        assert_eq!(extract_path_and_query("GET /oauth-callback?code=x"), None);
    }

    #[test]
    fn rejects_request_lines_with_a_fragment() {
        assert_eq!(
            extract_path_and_query("GET /oauth-callback?code=x#fragment HTTP/1.1"),
            None
        );
    }
}

#[tauri::command]
pub fn start_oauth_server(app: AppHandle) -> Result<String, String> {
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|error| {
        format!("Failed to bind OAuth server to a dynamic localhost port: {error}")
    })?;
    let port = listener
        .local_addr()
        .map_err(|error| format!("Failed to read OAuth server address: {error}"))?
        .port();

    std::thread::spawn(move || {
        for stream in listener.incoming() {
            match stream {
                Ok(mut stream) => {
                    let mut buffer = [0; 2048];
                    if let Ok(size) = stream.read(&mut buffer) {
                        let request = String::from_utf8_lossy(&buffer[..size]);
                        let first_line = request.lines().next().unwrap_or("");
                        if let Some(path_and_query) =
                            extract_path_and_query(first_line).filter(|target| {
                                *target == "/oauth-callback"
                                    || target.starts_with("/oauth-callback?")
                            })
                        {
                            let payload = path_and_query.to_string();
                            let _ = app.emit("oauth-callback", payload);

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

                            break;
                        }
                    }
                }
                Err(e) => {
                    eprintln!("OAuth server connection error: {}", e);
                }
            }
        }
    });
    Ok(format!("http://127.0.0.1:{port}/oauth-callback"))
}
