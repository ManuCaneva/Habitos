# 01: Prefactor — extraer `fetchCalendars()` del sync

**What to build:** Refactor puramente conductual-neutro: hoy `syncYear()` fetchea el
calendarList de Google inline (junto con los eventos de cada calendario). Esta ticket extrae
esa lógica a un action propio del store de calendario (`fetchCalendars()`), de modo que exista
un único proveedor de la lista de calendarios, reutilizable después tanto por el sync como por
la futura card de Settings. El usuario no ve ningún cambio: el calendario anual sigue
sincronizando y mostrando exactamente lo mismo, y todos los tests existentes quedan en verde.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] El store expone un action `fetchCalendars()` que hace el fetch del calendarList y
      actualiza la lista de calendarios (metadata completa, incluida la del calendario
      primario) y el mapa de colores.
- [x] `syncYear()` usa `fetchCalendars()` internamente; no hay lógica de fetch del
      calendarList duplicada.
- [x] Comportamiento observado idéntico al previo: eventos, errores de sync y mensajes
      (`syncError`) no cambian.
- [x] Suite completa en verde (`npm run test`), incluyendo los tests existentes del store de
      calendario; los tests del refactor mockean los mismos seams que el prior art
      (`@/lib/db` + plugins Tauri con `vi.mock()`).
- [x] `npm run build`, `npm run lint` y `npm run format:check` pasan.

## Comments

- 2026-09-08: Implementado con TDD. Nuevo action `fetchCalendars()` en
  `src/stores/calendar.ts` (fetch del calendarList, actualiza `calendars` y retorna el mapa
  de colores); `fetchWithRetry` se movió a scope del store para compartirlo; `syncYear()`
  lo consume y deriva los ids de `calendars.value`. 3 tests nuevos en
  `src/stores/calendar.test.ts` (lista sin eventos, error, 401 con refresh+retry). Suite:
  847 passed; `calendar.test.ts`: 40 passed. Build, lint y prettier en archivos tocados en
  verde. Code-review: Standards sin violaciones duras (2 smells menores no bloqueantes,
  uno aplicado: `const items`); Spec sin faltantes ni scope creep. Nota: el working tree
  contiene cambios ajenos sin commitear (OAuth client_secret, weekly schedule) que no son
  parte de este ticket y quedan sin commitear.

## Comments
