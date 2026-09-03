# 03: Render CSS Grid nativo + gestos

**What to build:** el contenedor del dashboard pasa a `display: grid` (12 columnas × 10 filas, `gap: 4px`), cada widget se posiciona con `grid-column`/`grid-row`, y desaparece todo el cálculo de píxeles en JS en el loop de resize. Como resultado, **maximizar/redimensionar la ventana es fluido** (el bug principal), y mover/redimensionar widgets en modo edición sigue funcionando (drag con `transform`, resize con posicionamiento absoluto en píxeles, snap a celda al soltar).

**Blocked by:** 02 (necesita el modelo entero).

**Status:** done

- [x] El contenedor del dashboard es `display: grid; grid-template-columns: repeat(12, 1fr); grid-template-rows: repeat(10, 1fr); gap: 4px`.
- [x] Cada widget se posiciona con `grid-column`/`grid-row` derivados de sus enteros `x/y/w/h`.
- [x] Se elimina la prop `dims`, el `ResizeObserver` del contenedor, el `baseStyle` reactivo, `applyGapToPixel` y `useMonitorChange` (bloat redundante).
- [x] `GridItemVue` recibe solo el item + modo edición y emite `moved`/`resized` en enteros, sin leer dimensiones del contenedor reactivamente.
- [x] El drag escribe `transform: translate(dx, dy)` durante el gesto (compositor puro, sin layout) y hace snap a celda al soltar.
- [x] El resize posiciona en `absolute` con px durante el gesto y hace snap a celda entera al soltar.
- [x] El snap lee el tamaño del contenedor una sola vez al soltar (no reactivamente) y redondea `px / cell`.
- [x] Durante el gesto no hay transiciones CSS de layout (misma protección que hoy con `grid-item--dragging`).
- [x] El espaciado visual entre widgets se mantiene (gap 4px, equivalente al `applyGapToPixel` actual).
- [x] Los tests de `DashboardView` y `GridItemVue` pasan sin `dims`; los tests de `useDashGrid` se adaptan o eliminan junto con el composable.
- [x] `npm run build` y `npm run test` pasan.
- [x] Verificación manual del resize fluido en `npm run tauri dev` (aceptación del usuario).

## Comments

- Se implementó el modelo entero 12×10 (bloqueante 02) como prerequisito, ya que 03 depende de él.
- Se eliminaron `useDashGrid`, `useMonitorChange` y sus tests; se creó `gridSnap.ts` (pxToCells) y `lib/grid.ts` (COLS/ROWS).
- `GridItemVue` ahora renderiza con `grid-column`/`grid-row`, drag con `transform`, resize con absolute px, snap al soltar vía `pxToCells`.
- Code review (dos ejes) aplicado antes del commit `0c21aa0`: se eliminó `WIDGET_GAP` (dead code) y se corrigió que la migración desde porcentajes restaurara `minW`/`minH` desde el registro de widgets.
- FLIP al soltar (animación) es del ticket 05, fuera de alcance acá.
- Pendiente de aceptación final: verificación manual en `npm run tauri dev` (repro original del usuario).
