# 04: Círculo segmentado + vistas (HabitCard y HabitRow)

Status: done

Blocked by: 02 — Store progresivo

**What to build:** El botón de check-in pasa de un check binario a un círculo segmentado (un segmento por repetición), y se cablea en las dos vistas de hábitos. Al terminar este ticket, un hábito diario con `target > 1` muestra su círculo segmentado: cada tap enciende un segmento, al llenarse se funde en un círculo sólido, tocar el lleno lo resetea y un `−` en hover decrementa de a 1.

- [x] Un componente `SegmentedCheckCircle` recibe `target`, `count` (o `progress`) y color; renderiza `target` segmentos y enciende `count` de ellos.
- [x] Con `target = 1` el componente degenera al check binario actual (Check/Plus), sin contador ni `−`.
- [x] `HabitCard` usa el círculo segmentado: tap enciende un segmento (`incrementCheckIn`), tap en lleno resetea (`decrementCheckIn` hasta 0), y `−` en hover decrementa de a 1.
- [x] `HabitRow` usa el mismo círculo y conserva su fila, racha y estilos.
- [x] El subtítulo del hábito muestra el target para hábitos diarios con `target > 1` (ej. "Diario · 8/día") vía `frequencyLabel`.
- [x] Tests de componentes (props/emit) cubren: render segmentado según `target`, `target = 1` binario, y las llamadas a incrementar/decrementar.

## Comments

- Se agregó la acción `resetCheckIn(habitId)` al store (borra el log del día) para soportar el "tap en lleno = reset a 0" del AC3; `decrementCheckIn` sigue bajando de a 1.
- `SegmentedCheckCircle.vue` (en `src/components/ui/`) recibe `target`/`count`/`color`; emite `increment`/`decrement`/`reset`. Con `target = 1` degenera al Check/Plus binario.
- `HabitCard.vue` y `HabitRow.vue` reemplazan su botón por el círculo; ambos leen `count` de `completedToday` del store.
- `frequencyLabel` devuelve "Diario · N/día" para daily con `target > 1`.
- Se eliminó CSS muerto de `.habit-card-checkin` en `tailwind.css` (el círculo ahora vive en el componente).
- Tests: `SegmentedCheckCircle.test.ts` (11), `HabitCard.test.ts` (+6), `HabitRow.test.ts` (+5), `frequencyLabel.test.ts` (+1), store `resetCheckIn` (+2).
