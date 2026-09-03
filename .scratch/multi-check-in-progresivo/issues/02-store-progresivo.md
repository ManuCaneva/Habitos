# 02: Store progresivo — incrementar / decrementar progreso

Status: done

Blocked by: 01 — Fundamento de datos

**What to build:** La lógica del store que acumula y decrementa repeticiones de un hábito diario, con clamping al target y borrado al llegar a cero. Al terminar este ticket, el estado del día deja de ser binario y refleja cuántas repeticiones lleva cada hábito, aunque la UI todavía no lo muestre.

- [x] `completedToday` (o un getter equivalente) deja de ser un `Set` binario y expone el progreso por hábito del día (mapa `habit_id → count`), manteniendo un acceso booleano "progreso ≥ 1" para las vistas binarias.
- [x] `incrementCheckIn(habitId)` suma 1 sin pasarse del `target`, persistiendo vía `upsertHabitLog` y actualizando `logs` reactivamente.
- [x] `decrementCheckIn(habitId)` resta 1, y al llegar a 0 borra el log del día (uncheck total).
- [x] `currentStreak` mantiene su semántica (día cumplido = tiene log), que ya coincide con "progreso ≥ 1".
- [x] Los tests del store cubren: acumulación sin superar target, decremento de a 1, borrado en 0, y racha con progreso parcial.

## Comments

- **2026-08-28 — Implementación.** `completedToday` ahora es `computed<Map<string, number>>` (habit_id → count del día). Se agregó `isCompletedToday(habitId)` (progreso ≥ 1) para las vistas binarias y `completedToday` se mantiene como mapa para las vistas progresivas.
- Se reemplazaron `checkIn`/`undoCheckIn` por `incrementCheckIn`/`decrementCheckIn`. `incrementCheckIn` clampa al `target_per_period` del hábito (busca el habit en el store y tira error si no existe) y persiste vía `db.upsertHabitLog` reusando id/created_at del log existente. `decrementCheckIn` resta 1; con count ≤ 1 borra el log vía `db.deleteLog` (uncheck total). `currentStreak` no cambió: día cumplido = tiene log = progreso ≥ 1.
- Componentes: `HabitCard.vue` y `HabitRow.vue` usan `isCompletedToday` + `incrementCheckIn`/`decrementCheckIn` en su toggle. Se actualizaron los mocks de `@/stores/habits` y `@/lib/db` en todos los tests afectados.
- Tests: 6 nuevos en `src/stores/habits.test.ts` (acumulación, clamping, progreso por día, isCompletedToday, decremento, borrado en 0, no-op sin log, racha con progreso parcial). Suite completa: 677 tests verde. Typecheck, lint, format y build OK.
