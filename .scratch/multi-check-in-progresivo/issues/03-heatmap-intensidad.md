# 03: Heatmap con intensidad proporcional

Status: ready-for-agent

Blocked by: 02 — Store progresivo

**What to build:** El heatmap de historial tiñe cada día con una intensidad proporcional al progreso alcanzado, en vez de binario. Al terminar este ticket, un día con 4/8 se ve a media intensidad y uno con 8/8 a intensidad plena, de modo que se note de un vistazo qué días se cumplió de más o de menos.

- [ ] `buildHeatmapGrid` produce celdas que conocen `count` y `target` (no solo `completed`).
- [ ] `HeatmapGrid` calcula la intensidad como `count / target` (clampado a 1) y la pasa a `shadeFor`.
- [ ] Con `target = 1`, la intensidad colapsa al comportamiento binario actual (completo vs. 0.15).
- [ ] Tests del grid cubren intensidad proporcional y el caso `target = 1`.
