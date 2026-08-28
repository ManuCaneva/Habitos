# 05: FLIP al soltar

**What to build:** al soltar un widget movido o redimensionado en modo edición, se acomoda visualmente con una animación suave (FLIP con `transform`, ~150-200ms, easing consistente), en lugar de un salto brusco. No reintroduce jank: solo anima `transform` en el compositor, nunca `left/top/width/height`.

**Blocked by:** 03 (necesita el render grid + gestos con snap al soltar).

**Status:** done

- [x] Al soltar un drag o resize se aplica animación FLIP: medir antes, invertir con `transform`, animar a cero.
- [x] La animación usa solo `transform` (compositor puro), nunca propiedades que fuercen layout.
- [x] Duración y easing consistentes (~150-200ms), reutilizando el vocabulario de motion del proyecto y alineado con DESIGN.md (se agrega el token de easing si hace falta).
- [x] Durante el gesto no hay transiciones (comportamiento actual preservado).
- [x] El resize de ventana global no se ve afectado (sigue sin animación de layout por frame).
- [x] Tests de `GridItemVue`/`DashboardView` siguen pasando (la animación no rompe el comportamiento vía props/emit).
- [x] `npm run build` y `npm run test` pasan.

## Comments

- Se creó `src/composables/flip.ts` con `flipTransform(first, last)` (inversión FLIP: `translate(first-left - last-left, ...) scale(first.w/last.w, ...)`), `flipNeedsAnimation`, `FLIP_DURATION_MS = 180` y `FLIP_EASING = cubic-bezier(0.16, 1, 0.3, 1)`. TDD en `flip.test.ts`.
- En `GridItemVue.vue`: al soltar un drag/resize se captura `getBoundingClientRect()` antes de emitir, se emite el snap, y en `nextTick()` (cuando la grilla ya posicionó el item en su celda final) se aplica `applyFlip`: transición `none`, se escribe el `transform` invertido, `void el.offsetWidth` fuerza el reflow, y se anima `transform → ''` con `transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1)`. Nunca toca `left/top/width/height`.
- Se agrega la clase `grid-item--flip` (con `will-change: transform`) mientras dura la animación; `isFlipping` se resetea por `setTimeout(FLIP_DURATION_MS)`.
- El easing `cubic-bezier(0.16, 1, 0.3, 1)` es el mismo que ya usa `YearCalendarWidget` (transición del grid de meses); vive como única fuente de verdad en `FLIP_EASING` (`src/composables/flip.ts`), alineado con el vocabulario de motion de DESIGN.md.
- Durante el gesto sigue la clase `grid-item--dragging` con `transition: none !important` (sin transiciones mientras arrastrás/redimensionás).
- Verificación manual pendiente en `npm run tauri dev` (mismo repro del usuario que en 03).
