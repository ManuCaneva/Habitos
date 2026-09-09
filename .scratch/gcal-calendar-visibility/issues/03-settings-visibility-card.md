# 03: Card de Settings — checkboxes de visibilidad de calendarios

**What to build:** El flujo completo visible para el usuario: en Settings, debajo de la card
de conexión de Google Calendar, aparece una card que lista los calendarios de la cuenta con
checkbox + swatch de color + nombre. Tildar/destildar oculta/muestra el calendario con
re-sync inmediato del dashboard (lo que hace que los eventos aparezcan/desaparezcan al toque).
Si la lista en memoria está vacía y hay conexión, la card la trae con un fetch liviano
on-demand al montar. Sin conexión, muestra un estado vacío claro invitando a conectar.
El calendario primario puede ocultarse como cualquier otro; ocultar nunca saca un calendario
del dropdown de destino del modal de día. Demoable end-to-end con `npm run tauri dev`.

**Blocked by:** 02 — Núcleo de visibilidad: schema, persistencia y filtro al fetch.

**Status:** done

- [x] La card lista todos los calendarios de la cuenta (metadata completa) con su color y
      nombre, y el checkbox refleja la preferencia actual del store.
- [x] Toggle de un checkbox llama al action del store que oculta/muestra: el dashboard se
      actualiza de inmediato (re-sync del año actual) y la preferencia queda persistida.
- [x] Al montar, si está conectado y la lista está vacía, se hace el fetch liviano del
      calendarList una sola vez; no se fetchea si ya hay lista ni si no hay conexión.
- [x] Estado vacío visible cuando Google Calendar no está conectado, con mensaje claro.
- [x] Ocultar un calendario (incluso el primario) no lo saca del dropdown de destino del
      modal de día ni cambia el destino por defecto.
- [x] Tests del componente (props/estado del store vía `@vue/test-utils`, sin estado interno)
      al lado del componente; edge cases: lista vacía, toggle múltiple, sin conexión.
- [x] `npm run test`, `npm run build`, `npm run lint`, `npm run format:check` y
      `npm run test:perf` (data path del dashboard) pasan.

## Comments

- Implementado con TDD rojo→verde: `src/components/calendar/GcalVisibilityCard.vue` +
  `GcalVisibilityCard.test.ts` (10 tests: lista con color/nombre/checkbox, toggle simple y
  múltiple, primario ocultable, fetch on-mount ×3 ramas, vacío sin conexión, fallback swatch).
- Integración: `<GcalVisibilityCard />` en `SettingsView.vue` debajo de la card de conexión;
  4 tests de integración en `SettingsView.test.ts`; 1 test en `DayDetailsModal.test.ts` que
  fija que los ocultos siguen en el dropdown con el primario por defecto.
- El re-sync inmediato y la persistencia los maneja `setCalendarHidden` del ticket 02; la
  card solo delega. Sin lógica en Rust (TypeScript/Vue únicamente).
- Code-review (2 ejes): spec sin faltantes ni creep; 1 hallazgo de standards corregido
  (fallback `#5e6ad2` hardcodeado → token `rgb(var(--color-primary))`, patrón PomodoroView).
- Verificación: suite 885 passed (81 files), `vue-tsc` limpio, `build` OK, `lint` limpio,
  `format` limpio en archivos del ticket, `test:perf` verde
  (longTasks=14 maxGap=166.6ms settle=278ms).
