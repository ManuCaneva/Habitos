# 04: Contención y recompute discreto

**What to build:** los widgets pesados (calendario anual, cronograma semanal) dejan de recomputar por frame durante el resize. El costo de layout interno de cada widget queda contenido dentro de su grid item y no se propaga al resto del dashboard. El resultado es un resize fluido incluso con los widgets pesados visibles.

**Blocked by:** 03 (aplica contención y recompute sobre la grilla ya nativa).

**Status:** done

- [x] Los grid items aplican `contain: layout paint` (el widget ya es `overflow: hidden`).
- [x] El calendario anual acota su recompute por rAF y solo actualiza estado si cambió algo significativo (número de columnas, slots visibles, tamaño de celda en pasos discretos).
- [x] Las celdas del calendario escalan por CSS var sin re-render de Vue, y los meses fuera del viewport aplican `content-visibility: auto`.
- [x] El cronograma semanal acota su `measure()` por rAF.
- [x] La lógica de dominio de los widgets (calendario, cronograma) no cambia: solo se acota su recompute.
- [x] El harness de rendimiento (01) muestra mejora medible respecto de la línea base al cambiar de tamaño con los widgets pesados visibles.
- [x] `npm run build` y `npm run test` pasan.

## Resultados de rendimiento (harness 01)

| Modo                                  | Baseline               | Ahora                  |
| ------------------------------------- | ---------------------- | ---------------------- |
| `--focus year-calendar` long tasks    | 8+ (68–87ms)           | 3 (máx 71ms)           |
| `--focus year-calendar` max frame gap | 100.0ms                | 66.7ms                 |
| `--focus year-calendar` settle        | 396ms                  | 88ms                   |
| full dashboard long tasks             | 14                     | ~12                    |
| `--focus weekly-schedule`             | 0 / 16.8ms / 84ms (OK) | 0 / 16.8ms / 84ms (OK) |

El hotspot restante es layout/paint nativo del navegador (los ~504 `day-cell` del calendario recalculan layout al cambiar `--cell-size`), no JS: el perfil muestra `runRecompute` ~0 muestras tras eliminar la lectura síncrona de `clientWidth/clientHeight` (el tamaño ahora viene del `contentRect` del ResizeObserver, que no fuerza layout).
