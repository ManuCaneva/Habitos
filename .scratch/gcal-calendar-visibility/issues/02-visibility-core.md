# 02: Núcleo de visibilidad — schema, persistencia y filtro al fetch

**What to build:** La capacidad de ocultar calendarios funciona de punta a punta en el dominio
(aún sin UI): un schema Zod define la preferencia `{ hiddenCalendarIds: string[] }` como
objeto wrapper extensible; la preferencia persiste en la tabla config bajo una key propia
(mismo patrón que las settings del cronograma semanal) y sobrevive a desconexiones y
reconexiones de Google Calendar; el sync de eventos salta los calendarios ocultos (no los
fetchea, sus fallos no generan `syncError`); un action `setCalendarHidden(id, hidden)`
actualiza el set, persiste y, si hay conexión, dispara re-sync inmediato del año actual.
Los eventos locales de AEON nunca se filtran. Semántica opt-out: calendarios nuevos visibles
por default. JSON corrupto → fallback a todo visible. Verificable vía tests del store y del
schema; no hay UI todavía.

**Blocked by:** 01 — Prefactor: extraer `fetchCalendars()` del sync.

**Status:** done

- [x] Schema: parse válido de la preferencia, default `[]` cuando falta el campo, rechazo de
      tipos incorrectos, y `safeParse` con fallback al default ante JSON corrupto.
- [x] Wrappers de persistencia (load/save) en la capa db, con roundtrip correcto y default
      cuando la key no existe.
- [x] El store carga la preferencia persistida al iniciar (`loadPersistedConfig`) y la expone
      como set de solo lectura.
- [x] `syncYear()` no fetchea eventos de calendarios ocultos; los visibles sí; los fallos de
      ocultos no cuentan en `syncError` (y si todos están ocultos, no hay error).
- [x] La lista de calendarios (metadata) queda completa siempre, aunque haya ocultos: la usa
      el dropdown de destino del modal de día.
- [x] `setCalendarHidden(id, hidden)` persiste la preferencia y, conectado, re-sincroniza el
      año actual de inmediato.
- [x] La preferencia sobrevive a desconectar/reconectar Google Calendar.
- [x] Los eventos locales (`calendarId === 'local'`) no se ven afectados por el filtro.
- [x] TDD rojo→verde por capa (schema → wrappers → store) con los seams de mock habituales.

## Comments

- Implementado con TDD por capas (schema → db → store), seams: `parse`/`safeParse`,
  `invoke` mockeado, `vi.mock('@/lib/db')` + plugins Tauri mockeados.
- Schema: `GcalVisibleCalendarsSchema` + `parseGcalVisibleCalendarsJson` en
  `src/schemas/calendar.ts` (fallback retorna arrays nuevos, sin compartir referencia
  con el default).
- Persistencia: `loadGcalVisibleCalendars` / `saveGcalVisibleCalendars` en `src/lib/db.ts`,
  key `gcal-visible-calendars` (mismo patrón que `weekly-schedule-settings`).
- Store (`src/stores/calendar.ts`): `hiddenCalendarIds` (readonly), `isCalendarHidden()`,
  `setCalendarHidden(id, hidden)` con re-sync del año actual si conectado;
  `syncYear()` filtra ocultos del fetch de eventos pero conserva metadata completa;
  `loadPersistedConfig()` restaura la preferencia; `disconnect()` no la borra.
- Code-review (2 ejes): 3 hallazgos propios corregidos (default mutable compartido,
  `.sort()` no especificado, validación duplicada en mock de test + test de aislamiento
  de fallos ocultos agregado). El resto del "scope creep" reportado (OAuth secrets,
  WeeklySchedule, debugLog) son cambios ajenos preexistentes en el workspace, no de
  este ticket — no se tocan aquí.
- Verificación: suite 871 passed, `vue-tsc` limpio, `lint` limpio, `build` OK.
  `test:perf` no aplica (no toca dashboard/grilla).
