# Spec: Visibilidad configurable de calendarios de Google Calendar

Status: ready-for-agent
Label: ready-for-agent

## Problem Statement

Un usuario de AEON conecta su cuenta de Google Calendar y el calendario anual del dashboard
muestra los eventos de **todos** los calendarios de su cuenta de Google. En la práctica, la
cuenta incluye calendarios que no aportan nada a la vista personal (por ejemplo, calendarios
institucionales como "UTN Asignaturas"), así que la grilla anual queda contaminada de eventos
irrelevantes. Hoy no existe ninguna forma de elegir qué calendarios ver: el `calendarList`
completo se sincroniza y se muestra siempre, sin filtro (gap documentado en
`.scratch/gcal-oauth-fix/spec.md:210`).

## Solution

Una card nueva en Settings ("Google Calendar"), debajo de la card de conexión, que lista los
calendarios de la cuenta con checkbox, swatch de color y nombre. El usuario marca cuáles no
quiere ver; los calendarios ocultos dejan de sincronizarse (no se fetchean sus eventos) y por
lo tanto desaparecen de la vista anual. La preferencia persiste en la tabla `config` y
sobrevive desconexiones/reconexiones de la cuenta. Ocultar un calendario afecta **solo la
vista**: sigue disponible como destino al crear/editar eventos desde el modal de detalle de
día.

## User Stories

1. Como usuario de AEON con Google Calendar conectado, quiero ver una lista de todos mis
   calendarios en Settings, para saber qué tengo y decidir qué ocultar.
2. Como usuario, quiero tildar/destildar un checkbox por calendario, para ocultar los que no
   me interesan sin tocar los demás.
3. Como usuario, quiero que los eventos de los calendarios ocultos desaparezcan del calendario
   anual del dashboard, para que solo vea lo que me importa.
4. Como usuario, quiero que al ocultar un calendario deje de fetchearse (no solo de
   mostrarse), para que el sync sea más rápido y consuma menos requests.
5. Como usuario, quiero que mi selección quede persistida entre sesiones de la app, para no
   tener que reconfigurar cada vez que abro AEON.
6. Como usuario, quiero que mi selección sobreviva a desconectar y reconectar Google Calendar,
   para no perder la configuración al renovar la sesión.
7. Como usuario, quiero ver el color de cada calendario junto a su nombre en la lista, para
   identificarlos rápido contra lo que veo en la grilla anual.
8. Como usuario, quiero poder ocultar cualquier calendario, incluido el primario, para tener
   control total sobre la vista.
9. Como usuario, quiero que ocultar un calendario no lo saque del dropdown de destino al
   crear/editar eventos en el modal de día, para poder seguir escribiendo en calendarios que
   no muestro.
10. Como usuario, quiero que el calendario primario siga siendo el destino por defecto al
    crear un evento aunque esté oculto, para que el flujo de creación no cambie.
11. Como usuario, quiero que al tildar un checkbox el dashboard se actualice de inmediato
    (re-sync del año actual), para no tener que recargar ni esperar al próximo sync.
12. Como usuario, quiero que los eventos locales de AEON (creados sin Google) nunca se vean
    afectados por esta configuración, para que mis datos propios siempre estén visibles.
13. Como usuario, quiero que si un calendario oculto falla al sincronizar no genere error
    visible, porque directamente no se sincroniza.
14. Como usuario con la cuenta recién conectada en la sesión actual, quiero que la lista de
    calendarios en Settings cargue sola (fetch liviano del calendarList), para poder
    configurarla sin necesidad de pasar antes por el dashboard.
15. Como usuario con Google Calendar desconectado, quiero que la card me muestre un estado
    claro ("conectá Google Calendar…"), para entender por qué no hay lista.
16. Como usuario, quiero que si la preferencia guardada se corrompe, la app la ignore y
    arranque con todo visible, para no quedar en un estado roto.
17. Como usuario, quiero que los calendarios nuevos que aparezcan en mi cuenta de Google se
    muestren por defecto (semántica opt-out), para no perder eventos silenciosamente.
18. Como usuario, quiero que esta configuración no cambie el scope OAuth ni los permisos de
    escritura, para que seguir creando/editando/borrando eventos de Google como hasta ahora.

## Implementation Decisions

- **Capa**: todo en TypeScript/Vue. Cero cambios en Rust: la tabla `config` (key/value) ya
  existe y los comandos `save_config`/`load_config` son agnósticos al dominio.
- **Schema (Zod)**: `GcalVisibleCalendarsSchema` en el módulo de schemas de calendario:
  `{ hiddenCalendarIds: string[].default([]) }`. Objeto wrapper (no array pelado) para poder
  extender con opciones por-calendario más adelante sin migración. Carga con `safeParse` y
  fallback al default ante JSON corrupto.
- **Persistencia**: wrappers `loadGcalVisibleCalendars()` / `saveGcalVisibleCalendars()` en la
  capa `db`, clon del patrón de `weekly-schedule-settings`, key `gcal-visible-calendars`.
- **Store** (`useCalendarStore`):
  - Estado nuevo: `hiddenCalendarIds` como `Set` de solo lectura, cargado en
    `loadPersistedConfig()`.
  - La lógica de fetch del calendarList se extrae de `syncYear()` a un action
    `fetchCalendars()` (1 request, sin eventos), reutilizado por `syncYear` y por la card de
    Settings cuando la lista en memoria está vacía. Sin duplicación.
  - `syncYear()` filtra los IDs del calendarList contra `hiddenCalendarIds` antes del
    `Promise.all` de eventos: los ocultos no se fetchean, sus fallos no cuentan en
    `syncError`. La lista `calendars` (metadata) se mantiene **completa**.
  - Action nuevo `setCalendarHidden(id, hidden)`: actualiza el set, persiste, y si hay
    conexión dispara `syncYear(currentYear)` (re-sync inmediato).
  - Los eventos locales (`calendarId === 'local'`) viven fuera del calendarList de Google y no
    se filtran.
- **Semántica opt-out**: se persisten los IDs _ocultos_; cualquier calendario nuevo en la
  cuenta de Google es visible por defecto.
- **UI**: componente nuevo en la capa de componentes de calendario (con su test al lado),
  usado desde `SettingsView` debajo de la card de conexión de Google Calendar. Lista con
  `Checkbox` + swatch de color + nombre; estado vacío si no hay conexión; on-mount hace
  `fetchCalendars()` si está conectado y la lista está vacía.
- **Escritura no restringida**: `DayDetailsModal` sigue usando la lista completa de
  calendarios como dropdown de destino; ocultar solo filtra la vista. El primario sigue siendo
  el destino por defecto aunque esté oculto.
- **Tokens/scope**: sin cambios (se mantiene `auth/calendar` read-write).

## Testing Decisions

- **Qué hace un buen test aquí**: solo comportamiento externo vía la API pública de cada capa
  (schema parse, wrappers de db con `invoke` mockeado, actions/estado del store, props/emits
  del componente). Nada de asomarse a estado interno del store ni de espiar llamadas internas
  entre funciones privadas. Los tests de store mockean `@/lib/db` y los plugins de Tauri con
  `vi.mock()`, nunca levantan el runtime real. Datos de prueba generados/fixtures, no valores
  mágicos copiados de la implementación.
- **TDD estricto por capa** (rojo → verde → refactor, en este orden):
  1. Schema: casos válidos, default cuando falta el campo, rechazo de tipos incorrectos,
     fallback ante JSON corrupto.
  2. Wrappers de db: roundtrip load/save contra `invoke` mockeado, default cuando la key no
     existe.
  3. Store: sync salta los calendarios ocultos (y fetchea los visibles), la lista
     `calendars` queda completa, `setCalendarHidden` persiste y re-sincroniza, la preferencia
     se carga al iniciar (`loadPersistedConfig`), sobrevive a desconexión, eventos locales no
     filtrados.
  4. Componente: render de la lista desde el store, toggle emite el cambio al store, estado
     vacío sin conexión, fetch liviano on-mount solo cuando corresponde.
- **Prior art**: los tests existentes del store de calendario (mock de `@/lib/db` y plugins
  Tauri como seam), y los tests de componentes con `@vue/test-utils` ya presentes en
  `src/components/ui/`.
- **Perf**: el cambio toca el data path del dashboard, así que `npm run test:perf` debe seguir
  verde. El filtro reduce trabajo (menos fetches), no lo agrega.

## Out of Scope

- Botón "mostrar todos" / reset masivo (destildar uno por uno alcanza).
- Reordenar calendarios o editar sus colores.
- Restringir la escritura de eventos según visibilidad (ocultar ≠ bloquear).
- Configuración por-vista (ej. distinta visibilidad para el modal vs. el dashboard).
- Cachear el calendarList más allá de la sesión (sigue en memoria).
- Cualquier cambio al flujo OAuth, tokens o scope.

## Further Notes

- Decisiones tomadas en sesión de grilling con el usuario (9 preguntas): filtrar al fetch,
  opt-out (lista de ocultos), card solo en Settings, ocultar no afecta escritura, primario
  ocultable, re-sync inmediato al togglear, fetch liviano del calendarList on-demand,
  preferencia persistente entre reconexiones, sin botón de reset.
- El usuario pidió explícitamente una solución "escalable, no atada con alambre": de ahí el
  objeto wrapper en el schema (extensible), la extracción de `fetchCalendars()` (un solo
  proveedor de la lista para sync y settings) y el apego estricto a los patrones existentes
  (config table, patrón weekly-schedule-settings, TDD por capa).
- Este feature completa el gap documentado en `.scratch/gcal-oauth-fix/spec.md` ("selección/
  filtro de calendarios a sincronizar").
