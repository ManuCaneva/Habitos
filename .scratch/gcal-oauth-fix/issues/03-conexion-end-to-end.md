# 03: Conexión end-to-end — pendiente persistente, callback canónico, estados visibles

**Status:** done

**What to build:** El tracer bullet: un usuario hace clic en "Conectar", ve que la app está esperando su autorización, completa el consentimiento en el navegador y vuelve a la app realmente conectada. Si algo falla en cualquier punto, lo ve. Es el ticket que cierra el bug reportado.

**Blocked by:** 01 (helpers), 02 (servidor loopback)

## Qué entrega

1. **Connect() reescrito sobre el nuevo contrato**:
   - Levanta el servidor loopback vía invoke y recibe la redirect URI real (fin del branch dev/prod y del hardcodeo de puerto en el frontend).
   - PKCE sin secret (usa los builders de 01).
   - El estado pendiente `{ verifier, state, redirectUri, createdAt }` se **persiste en la tabla de config** (clave dedicada, ej. `gcal_pending_oauth`) antes de abrir el navegador — sobrevive recargas/HMR del webview. TTL de 10 minutos: un callback más viejo se rechaza y se informa.
   - Marca el estado de UI "esperando autorización" para Settings.
2. **Callback canónico**: el listener del evento `oauth-callback` recibe la query cruda de Rust y la parsea con el helper de 01 (decodificación única). Se elimina el listener de deep-link del flujo OAuth (queda fuera de la decisión de diseño; el plugin sigue instalado para usos futuros).
3. **Errores visibles, nunca silencio**: error de Google (`error=access_denied`), state mismatch, callback sin pendiente válido o vencido, fallo del exchange → todos setean un error de conexión **visible**. Fin de los `catch {}` vacíos en los canales de callback.
4. **`connectError` separado de `syncError`**: la conexión y la sincronización tienen ciclos de vida distintos; el sync deja de pisar/borrar errores de conexión. El store expone ambos por separado.
5. **Limpieza del pendiente**: en éxito, error o expiración, la clave de config del pendiente se borra. Si llega un callback sin pendiente vigente, se informa y se descarta.
6. **Settings refleja la verdad**: estados — botón Conectar (idle) → "Esperando autorización en el navegador…" (esperando, cancelable) → Connected (conectado) / Not connected (con error persistente visible debajo hasta que algo lo resuelva). El error no desaparece solo.
7. **Muerte de código muerto**: `exchangeCodeDirect` (variante sin validación de state, sin llamadores) se borra.

## Acceptance criteria

- [x] TDD en el store: tests que capturan cada defecto van rojos primero — callback con `%2F` en el code conecta (hoy no conecta); state mismatch produce error visible (hoy silencio); callback recibido tras "recargar" el store (pendiente re-hidratado desde config) conecta; callback vencido (>10 min) se rechaza con error; `error=access_denied` se muestra.
- [ ] El flujo completo funciona de verdad en `npm run tauri dev`: Conectar → consent → Connected verde, y los tokens quedan con contenido en la base (verificación manual en la tabla config). Requiere credenciales/entorno Tauri y no se ejecutó en esta sesión.
- [x] Settings nunca queda en "esperando" para siempre sin feedback si el callback trae error o no llega tras cancelar en Google.
- [x] `connectError` y `syncError` son refs distintos; un sync fallido no borra el error de conexión ni viceversa.
- [x] No queda ningún `catch {}` vacío en los canales de callback del store.
- [x] `exchangeCodeDirect` no existe.
- [x] `npm run build` en verde; la suite de la card de Settings está actualizada a los nuevos estados. `npm run test` conserva 4 fallos preexistentes/no relacionados en weekly schedule y themes.

## Notas

- Seam principal: store del calendario con `vi.mock` de la capa de config y de los plugins de Tauri (prior art: la suite existente del store que ya mockea `onOpenUrl`/`listen` — esos mocks cambian al contrato nuevo).
- Seam UI: card de Google Calendar en Settings, comportamiento vía refs del store (props/estado expuesto), no internals.
- El secret deja de leerse en este ticket; su borrado del entorno es parte de 06.
