# 04: Contención y recompute discreto

**What to build:** los widgets pesados (calendario anual, cronograma semanal) dejan de recomputar por frame durante el resize. El costo de layout interno de cada widget queda contenido dentro de su grid item y no se propaga al resto del dashboard. El resultado es un resize fluido incluso con los widgets pesados visibles.

**Blocked by:** 03 (aplica contención y recompute sobre la grilla ya nativa).

**Status:** ready-for-agent

- [ ] Los grid items aplican `contain: layout paint` (el widget ya es `overflow: hidden`).
- [ ] El calendario anual acota su recompute por rAF y solo actualiza estado si cambió algo significativo (número de columnas, slots visibles, tamaño de celda en pasos discretos).
- [ ] Las celdas del calendario escalan por CSS var sin re-render de Vue, y los meses fuera del viewport aplican `content-visibility: auto`.
- [ ] El cronograma semanal acota su `measure()` por rAF.
- [ ] La lógica de dominio de los widgets (calendario, cronograma) no cambia: solo se acota su recompute.
- [ ] El harness de rendimiento (01) muestra mejora medible respecto de la línea base al cambiar de tamaño con los widgets pesados visibles.
- [ ] `npm run build` y `npm run test` pasan.
