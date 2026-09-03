# 03: Heatmap con intensidad proporcional

Status: done

Blocked by: 02 — Store progresivo

**What to build:** El heatmap de historial tiñe cada día con una intensidad proporcional al progreso alcanzado, en vez de binario. Al terminar este ticket, un día con 4/8 se ve a media intensidad y uno con 8/8 a intensidad plena, de modo que se note de un vistazo qué días se cumplió de más o de menos.

- [x] `buildHeatmapGrid` produce celdas que conocen `count` y `target` (no solo `completed`).
- [x] `HeatmapGrid` calcula la intensidad como `count / target` (clampado a 1) y la pasa a `shadeFor`.
- [x] Con `target = 1`, la intensidad colapsa al comportamiento binario actual (completo vs. 0.15).
- [x] Tests del grid cubren intensidad proporcional y el caso `target = 1`.

## Comments

- **2026-08-30 — Implementación.** `GridCell` gana `count` y `target`; `buildHeatmapGrid` acepta `target` opcional (default 1) y deriva `count` del log de cada fecha. `HeatmapGrid` recibe prop `target` y computa intensidad `count/target` (clamp a 1), manteniendo 0.15 para celdas sin progreso y el ring de "hoy" para días completados. `HabitCard` pasa `:target="habit.frequency.target_per_period"`. Tests: celdas con count/target, progreso parcial 4/8 → 50%, target=1 colapsa a binario. Suite completa 709 tests verde; build, lint y format OK.
