# 04: Círculo segmentado + vistas (HabitCard y HabitRow)

Status: ready-for-agent

Blocked by: 02 — Store progresivo

**What to build:** El botón de check-in pasa de un check binario a un círculo segmentado (un segmento por repetición), y se cablea en las dos vistas de hábitos. Al terminar este ticket, un hábito diario con `target > 1` muestra su círculo segmentado: cada tap enciende un segmento, al llenarse se funde en un círculo sólido, tocar el lleno lo resetea y un `−` en hover decrementa de a 1.

- [ ] Un componente `SegmentedCheckCircle` recibe `target`, `count` (o `progress`) y color; renderiza `target` segmentos y enciende `count` de ellos.
- [ ] Con `target = 1` el componente degenera al check binario actual (Check/Plus), sin contador ni `−`.
- [ ] `HabitCard` usa el círculo segmentado: tap enciende un segmento (`incrementCheckIn`), tap en lleno resetea (`decrementCheckIn` hasta 0), y `−` en hover decrementa de a 1.
- [ ] `HabitRow` usa el mismo círculo y conserva su fila, racha y estilos.
- [ ] El subtítulo del hábito muestra el target para hábitos diarios con `target > 1` (ej. "Diario · 8/día") vía `frequencyLabel`.
- [ ] Tests de componentes (props/emit) cubren: render segmentado según `target`, `target = 1` binario, y las llamadas a incrementar/decrementar.
