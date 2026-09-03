# 02: Servidor OAuth loopback — puerto dinámico, one-shot, query cruda

**Status:** done

**What to build:** Reescribir el command de Tauri que levanta el servidor HTTP local para el callback de Google, de modo que funcione igual en dev y en producción. El usuario ya no depende de un puerto fijo ni de un branch dev/prod en el frontend: al iniciar la conexión, la app levanta el servidor en un puerto libre, conoce su propia redirect URI y recibe la autorización una única vez.

**Blocked by:** None (can start immediately, paralelizable con 01)

## Qué entrega

1. **Puerto dinámico**: el bind pasa de un puerto fijo (hoy 14202) a `127.0.0.1:0` (puerto libre que elige el SO). Si el bind falla, el command devuelve error en lugar de solo loguearlo (hoy el frontend no se entera y el callback muere en silencio).
2. **El command devuelve la redirect URI**: `start_oauth_server` retorna `http://localhost:{puerto}/oauth-callback` (o `127.0.0.1` según lo que bindee) para que el caller la use en la URL de consent. Elimina la necesidad de adivinar el puerto desde TypeScript y el branch `import.meta.env.DEV` de `getRedirectUri`.
3. **Query cruda, sin tocar**: el servidor deja de parsear los pares de la query a mano (hoy sin decodificar URL — causa raíz del `invalid_grant`). Emite el evento `oauth-callback` con la request line/path+query cruda tal como llegó, y el parseo canónico vive en el frontend (ticket 01). Regla de oro: Rust solo I/O, cero lógica de negocio.
4. **One-shot**: tras entregar el primer callback válido (con o sin `error` en la query), el servidor responde con el HTML de éxito y termina. Fin del loop infinito que nunca se apaga.
5. **Orden honesto**: el HTML de "¡Inicio de sesión completado!" se sirve recién después de emitir el evento (la página ya no es una promesa vacía; la mentira residual la resuelve el ticket 03 con estados en Settings).
6. **Helper puro testeable**: extracción de path+query desde la request line como función pura con unit test en Rust (casos: GET con query, sin query, método no-GET, request line malformada, fragmento inexistente en HTTP/1.1).

## Acceptance criteria

- [x] TDD en Rust: unit test del helper de extracción va rojo primero, luego verde (`cargo test`).
- [x] Dos invocaciones consecutivas de `connect()` funcionan: cada servidor obtiene un puerto dinámico y no depende de `14202`.
- [x] El payload del evento `oauth-callback` contiene la ruta y query crudas percent-encoded (ej. `code=4%2F0AV...` intacta).
- [x] El command devuelve `Err(String)` si el bind falla.
- [x] El servidor se apaga solo tras el primer callback válido entregado.
- [x] `cargo check`, `cargo fmt --check` y `cargo clippy` en verde.

## Notas

- Seam: unit test Rust del helper puro + verificación manual con `tauri dev` (prior art: no hay tests Rust en commands; hay tests de DB en `src-tauri`).
- No tocar el store en este ticket: el frontend sigue usando el contracto viejo hasta 03. Si eso exige mantener un wrapper temporal del command con la firma vieja, preferible hacer el cambio de firma directo y dejar el frontend roto solo en tests mockeados (el invoke real no se llama hasta 03) — decidir en implementación por qué opción mantiene la suite verde.
- El HTML de éxito se sirve igual con `error=access_denied` (el navegador del usuario no puede hacer más; el estado real lo muestra la app).

## Implementación

- `start_oauth_server` bindea en `127.0.0.1:0`, devuelve la redirect URI con esa misma dirección,
  emite la ruta y query sin parsear y termina después del primer callback válido.
- El helper `extract_path_and_query` tiene cobertura unitaria para las request lines especificadas.
- La integración del payload crudo con el store y el uso de la URI devuelta quedan para los tickets
  de frontend posteriores.
