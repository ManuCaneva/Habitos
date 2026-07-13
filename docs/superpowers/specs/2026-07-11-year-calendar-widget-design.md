# Spec: Widget Calendario Anual + Google Calendar

**Fecha**: 2026-07-11
**Estado**: Borrador (pendiente de revisión del usuario)
**Feature source**: `docs/IDEAS.md:37-43` (Widget: Calendario anual)
**Stack**: Tauri 2 + Vue 3.5 + TypeScript + Pinia + Zod + Tailwind 3.4

---

## 1. Objetivo

Agregar un widget de dashboard "Calendario Anual" que muestra los 12 meses del año en una grilla responsive, sincronizada con Google Calendar vía OAuth 2.0 (PKCE). El usuario conecta su cuenta desde Settings; cada día del calendario muestra los eventos de Google como puntos de color. Incluye navegación entre años.

## 2. Scope

### Dentro
- Widget de dashboard "Calendario Anual" (12 meses, grid responsive por container query).
- Conexión OAuth 2.0 Authorization Code + PKCE con Google Calendar.
- Botón "Conectar / Desconectar Google Calendar" en `SettingsView`, debajo de la card "Datos".
- Apertura del navegador por defecto con consent de Google (scope `calendar.readonly`).
- Render de eventos como **puntos de color** por día (color del calendario/evento de Google), cap N + indicador `+`.
- Navegación de años `<` `>`.
- Fetch on-demand de eventos del año visible (en memoria, no cache persistente).

### Fuera (no se hace en esta feature)
- Marcadores locales de hábitos / tareas / objetivos sobre el calendario.
- Vista de mes/día individual, drag & drop de eventos.
- CRUD de eventos (solo lectura).
- iCal u otros proveedores.
- Cache persistente de eventos en SQLite (tabla nueva).
- Modificación al sistema existente de dashboard (grid rows, drag, layout store).

## 3. Decisiones acordadas

| Decisión | Valor | Razón |
|---|---|---|
| Credenciales OAuth | Guía de creación incluida; Client ID compilado en la app (vite `VITE_GCAL_CLIENT_ID`). | Arrancar limpio, sin compartir secretos. |
| Flujo OAuth | Authorization Code + PKCE (S256). | Estándar桌面/desktop, no requiere Client Secret. |
| Recepción del redirect | `tauri-plugin-deep-link` con scheme `com.goya.habitos://oauth/callback`. | UX limpia; el redirect vuelve a la app solo. |
| Almacenamiento del token | `config` KV table existente (`save_config`/`load_config`). | Local-first, sin migration nueva; aceptado por el usuario. |
| Render por día | Puntos de color (1 por evento, color de Google; cap N + `+`). | Compacto, escala a celdas chicas. |
| Sync | On-demand + memoria. | Mínimo scope; sin cache, sin tabla nueva. |
| HTTP a Google | `tauri-plugin-http` (Rust = transporte I/O puro). | Cumple regla de oro `ARCHITECTURE.md:14`. |
| Scope OAuth | `https://www.googleapis.com/auth/calendar.readonly`. | Mínimo privilegio. |
| Navegación | Botones `<` `>` para años. | Pedido explícito. |
| Fecha lib | Ninguna (native `Date` + helpers puros en `lib/calendarDates.ts`). | Evita dependencia nueva (`AGENTS.md`). |
| TanStack Query | No. | No instalado; fuera de scope. |

## 4. Arquitectura por capas

Cumple `docs/ARCHITECTURE.md:14-16`: Rust es solo I/O; toda la lógica vive en TS.

```
Vue (lógica + UI)
  stores/calendar.ts         ← orquestación: connect/disconnect/syncYear, refresh-on-expiry
  lib/googleOauth.ts         ← PKCE, buildAuthUrl, parseRedirectUri (puras)
  lib/googleCalendar.ts      ← buildEventsListUrl, mapGcalEventsToDomain, colorForEvent
  lib/calendarDates.ts        ← weeksForMonth, formatYyyyMmDd, yearBounds (sunday-first)
  schemas/calendar.ts         ← Zod: GcalEventApiResponse + CalendarEvent + CalendarConfig + mappers
  components/calendar/MonthMini.vue
  components/dashboard/YearCalendarWidget.vue
    ↓ invoke (Tauri)            ↓ http plugin       ↓ deep-link plugin
Rust (solo I/O)
  lib.rs: registra plugins deep-link + http. Cero comandos propios nuevos.
  (tokens via save_config/load_config existentes — commands/config.rs)
SQLite
  table config (migration 002 ya existe) guarda claves gcal_*
```

**Consecuencia**: el lado Rust **no recibe comandos nuevos propios**. Solo se enchufan dos plugins oficiales (deep-link, http) y se declaran en `capabilities`. Toda la lógica (PKCE, refresh, parseo, agrupación por fecha) es TS.

## 5. Dependencias nuevas

Ninguna de UI. Solo infra (plugins oficiales de Tauri 2):

- **Rust** (`src-tauri/Cargo.toml`):
  - `tauri-plugin-deep-link = "2"`
  - `tauri-plugin-http = "2"`
- **JS** (`package.json`):
  - `@tauri-apps/plugin-deep-link`
  - `@tauri-apps/plugin-http`
- **`src-tauri/capabilities/default.json`**: agregar
  - `http:default` con allowlist `["https://accounts.google.com/*","https://oauth2.googleapis.com/*","https://www.googleapis.com/calendar/*"]`
  - permisos de deep-link.
- **`src-tauri/tauri.conf.json`**: registrar scheme deep-link por OS (el plugin lo documenta).
- **Sin** lib de fecha nueva. **Sin** TanStack Query. **Sin** fullcalendar.

## 6. Archivos nuevos / modificados

| Archivo | Acción |
|---|---|
| `src/lib/calendarDates.ts` (+`.test.ts`) | nueva — helpers de fecha puros (sunday-first) |
| `src/lib/googleOauth.ts` (+`.test.ts`) | nueva — PKCE, buildAuthUrl, parseRedirectUri |
| `src/lib/googleCalendar.ts` (+`.test.ts`) | nueva — buildEventsListUrl, mapGcalEventsToDomain, colorForEvent |
| `src/schemas/calendar.ts` (+`.test.ts`) | nueva — Zod schemas + mappers |
| `src/stores/calendar.ts` (+`.test.ts`) | nueva — Pinia store |
| `src/components/calendar/MonthMini.vue` (+`.test.ts`) | nueva — mes miniatura |
| `src/components/dashboard/YearCalendarWidget.vue` (+`.test.ts`) | nueva — widget anual |
| `src/views/SettingsView.vue` (+ update `.test.ts`) | modificar — card Google Calendar abajo de "Datos" en `SettingsView.vue:42` |
| `src/lib/dashboardWidgets.ts` | modificar — registra `"year-calendar"` |
| `src-tauri/src/lib.rs` | modificar — `.plugin(deep-link).plugin(http)` |
| `src-tauri/Cargo.toml` | modificar — 2 crates |
| `src-tauri/capabilities/default.json` | modificar — permisos |
| `src-tauri/tauri.conf.json` | modificar — scheme deep-link |
| `docs/IDEAS.md` | modificar — marcar widget como implementado |

## 7. Detalles del layout (requisito clave)

**Requisito del usuario**: estirado totalmente en vertical, los 12 meses entran **sin scroll**; 1 columna apila 12, 2 columnas ponen 2 meses/fila, etc.

Implementación:
- Widget outer: `display:flex; flex-direction:column; min-height:0`.
- Header compacto fijo (año + `<` `>` + estado sync).
- Área de meses: `display:grid; grid-template-rows: repeat(rows, minmax(0,1fr)); grid-template-columns: repeat(cols, 1fr)` con `gap` de tokens (`xxs`/`xs`).
- `cols` elegido por **container query** (`container-type:inline-size` + `@container`) sobre el ancho del widget: 1→1 col, 2→2, 3→3, 4→4, 6→6, 12→12. `rows = 12/cols` (divisor entero de 12).
- Cada `MonthMini`: grid 7 cols (Sun→Sat header + 6 rows de semanas), `grid-template-rows: auto repeat(6,minmax(0,1fr))`, `min-height:0` en cada celda para encoger sin desbordar.
- Tipografía/dots escalados con `cqw` (container query units) para widgets chicas.
- **Trade-off aceptado**: a la altura default del dashboard, 12 meses en 1 col no entran — el usuario lo estira en edit mode (cumple "estirado completamente = entran; no implica que no se pueda achicar"). El `minHeight` default del widget registry es razonable; el usuario lo agranda si quiere 1 col sin scroll. No se toca el sistema de grid del dashboard (scope).

**Orden de celdas**: domingo primero (hardcodeado `weekStartsOn=0` en `calendarDates.ts`, testeado).

## 8. Flujo OAuth paso a paso

1. `connect()` genera `code_verifier` + `code_challenge` (S256 vía `crypto.subtle`).
2. `buildAuthUrl(client_id, redirect=com.goya.habitos://oauth/callback, scope=calendar.readonly, state, code_challenge)`.
3. `opener.openUrl(authUrl)` (plugin ya instalado `@tauri-apps/plugin-opener`) → navegador por defecto.
4. Google consent → redirect a `com.goya.habitos://oauth/callback?code=...` → `tauri-plugin-deep-link` captura evento, pasa URL al JS.
5. `parseRedirectUri` extrae `code` (o `error`).
6. POST `https://oauth2.googleapis.com/token` (vía `tauri-plugin-http` `fetch`) con `code + code_verifier` → `access_token`, `refresh_token`, `expires_in`.
7. `saveConfig("gcal_refresh_token", ...)` etc. `connected=true`.
8. `syncYear(currentYear)`:
   - `calendarList.list` (todos los calendars + colores).
   - `events.list` por cada calendar con `timeMin`/`timeMax` = año (RFC3339 con tz local).
   - `mapGcalEventsToDomain` agrupa por `YYYY-MM-DD`.
9. Refresh: si `access_token` expiró, POST refresh con `refresh_token` antes del próximo fetch; si refresh falla (revoked/inválido) → `connected=false`, limpiar claves.
10. `disconnect()`: POST `https://oauth2.googleapis.com/revoke` (opcional) + borrar claves `gcal_*` con `saveConfig(key, "")`. `connected=false`.

### Claves en `config` table
- `gcal_client_id` (string — en realidad viene de vite env, pero se puede persistir para override)
- `gcal_access_token`
- `gcal_refresh_token`
- `gcal_token_expiry` (ISO timestamp)
- `gcal_calendars_json` (JSON con la lista de calendars + colores, cacheada en memoria)

## 9. Estrategia de tests (TDD estricto — `AGENTS.md`)

Por cada archivo `.ts`/`.vue` el `.test.ts` al lado, primero rojo, después verde:

1. `lib/calendarDates.test.ts` → función pura más aislada.
2. `lib/googleOauth.test.ts` (mock `crypto.subtle`).
3. `schemas/calendar.test.ts` (fixtures de respuestas reales de GCal API).
4. `lib/googleCalendar.test.ts`.
5. `stores/calendar.test.ts` — `vi.mock("@/lib/db")`, `vi.mock("@tauri-apps/plugin-http")`, `vi.mock("@tauri-apps/plugin-deep-link")`. Casos: connect ok, connect con `error` en redirect, token expirado → refresh, refresh falla → desconecta, syncYear agrupa eventos, disconnect limpia.
6. `components/calendar/MonthMini.test.ts` (props/emit, no estado interno).
7. `components/dashboard/YearCalendarWidget.test.ts` (render 12 meses, orden dom→sáb, dots con color, year nav cambia store).
8. `views/SettingsView.test.ts` actualizado (card GCal, botón llama `connect`, estado refleja `connected`).
9. `cargo check` (`src-tauri` solo agregará 2 plugins oficiales).
10. `npm run test` + `npm run build` verde.

## 10. Riesgos técnicos

1. **Deep-link con scheme custom en Google OAuth** (mayor riesgo): Google históricamente es restrictivo con redirect URIs que no son loopback/https. Hay que registrar `com.goya.habitos://oauth/callback` como "Authorized redirect URI" y validar que Google lo acepte. **Mitigación**: spike temprano (test manual) como PRIMER paso de implementación — si Google lo rechaza, fallback a "Copia manual del code" (cero plugin deep-link). Documentado como paso 1 de la impl.
2. **Multi-calendario por cuenta**: fetch por cada calendar del usuario (parallelizable con `Promise.all`); respetar quotas de Google.
3. **Timezone**: Google devuelve RFC3339 con tz; bucketear por fecha local del usuario (helper `calendarDates.ts`).
4. **Token en texto plano en SQLite**: acordado por el usuario. Documentar el riesgo en README/AGENTS si hace falta, sin cambiar la estrategia.
5. **Tamaño por defecto del widget**: no cabe 12 meses en 1 col sin estirar; compatible con el requisito ("estirado completamente"). Explícito en el DoD.

## 11. Guía de credenciales Google (va en README interno)

1. Google Cloud Console → crear/seleccionar project.
2. APIs & Services → Enable **Google Calendar API**.
3. OAuth consent screen → External, completar app name `Habitos`, scopes: `.../auth/calendar.readonly`.
4. Credentials → Create OAuth client ID → **Web application** → Authorized redirect URIs: añadir `com.goya.habitos://oauth/callback`.
5. Copiar **Client ID** (el Client Secret NO hace falta con PKCE para desktop). Pegar en `.env` como `VITE_GCAL_CLIENT_ID`.
6. Mientras la app esté en "Testing", añadir la cuenta como test user.

## 12. Definition of Done

- [ ] Scope: solo lo de arriba (sin marcadores locales, sin CRUD, sin cache).
- [ ] `SettingsView` tiene card "Google Calendar" abajo de "Datos" con botón Conectar + estado.
- [ ] Conectar abre navegador por defecto con consent de Google (PKCE, scope `calendar.readonly`).
- [ ] Redirect deep-link capturado por la app (o fallback manual activado y documentado).
- [ ] `access_token` + `refresh_token` + expiry persistidos en `config` table (`save_config`).
- [ ] Refresh automático cuando el access token expira.
- [ ] `disconnect()` limpia tokens + (opcional) revoca en Google.
- [ ] `YearCalendarWidget` renderiza 12 meses, días ordenados **domingo primero**.
- [ ] Cant. de columnas responsive por ancho del widget (container query): 1→12filas, 2→6, 3→4, 4→3, 6→2, 12→1.
- [ ] A altura máxima del widget con 1 columna, los 12 meses entran **sin scroll vertical**.
- [ ] Cada día muestra puntos de color (color del calendario/evento de Google), cap N + indicador `+` overflow.
- [ ] Navegación `<` `>` cambia de año y refreshea eventos del nuevo año.
- [ ] Eventos fetched on-demand (no migration, no tabla nueva) vía `tauri-plugin-http`.
- [ ] Todo `.ts`/`.vue` tiene `.test.ts` al lado; `npm run test` verde; `npm run build` verde; `cargo check` verde.
- [ ] Sin TODOs, muertos ni comentarios. Sin dependencias de UI nuevas. Colores/spacing solo de tokens de `docs/DESIGN.md`.
- [ ] `docs/IDEAS.md` marcado el widget como implementado.