# 01: Harness de rendimiento (diagnóstico)

**What to build:** un comando automatizado que reproduce el jank de resize de ventana y lo mide de forma determinista. Sirve la app (vite), stubbea el IPC de Tauri para controlar layout y volumen de datos, anima el viewport (p.ej. 800×600 → 1920×1080 en ~1s) e inyecta `PerformanceObserver('longtask')` + medición de gaps entre frames + settle time. Al correrlo sobre el código actual, produce una línea base **roja** que cuantifica el bug (cuántos long tasks, gap máximo, tiempo de settle). Este es el feedback loop que valida todo lo demás.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Se agrega Playwright (solo Chromium) como devDependency, sin afectar el bundle de producción.
- [x] Existe un script de diagnóstico que arranca vite, stubbea el IPC de Tauri y anima el viewport.
- [x] El script inyecta `PerformanceObserver('longtask')`, mide gaps entre frames y settle time tras el último cambio.
- [x] El script imprime métricas legibles (long tasks >50ms, gap máximo, settle) con un modo "un widget a la vez" para minimizar el repro.
- [x] Corriendo contra el código actual, la salida muestra claramente el jank (baseline rojo) y no da falsos verdes.
- [x] Se documenta cómo correrlo (README o comentario del script).

## Comments

- Se agregó `@playwright/test` como devDependency (Chromium headless shell instalado con `npx playwright install chromium`). No toca el bundle de producción (es solo devDependency y los scripts viven en `scripts/` y `tests/perf/`).
- `scripts/perf-resize.mjs` arranca Vite en 1420 (reusa uno existente si ya corre), lanza Chromium, inyecta `tests/perf/inject-stub.js` (stub del IPC Tauri: `window.__TAURI_INTERNALS__.invoke` + event plugin + fixtures sintéticas con UUIDs válidos) y `tests/perf/page-metrics.js` (`PerformanceObserver('longtask')` + captura de frames vía rAF + `settle()` que resuelve cuando la cadencia vuelve a normal y no hubo long tasks en los últimos 300ms).
- Anima el viewport 800×600 → 1920×1080 en 20 pasos (~1s), imprime long tasks, max frame gap, settle y frames; marca verde/rojo contra el budget del spec (0 long tasks >50ms, gap <50ms, settle <250ms — calibración pendiente en ticket 06).
- Modo "un widget a la vez": `npm run perf:resize -- --focus year-calendar` (y `--focus weekly-schedule|habits|tasks|goals`). El layout por defecto del stub incluye los 5 widgets con los `minW/minH` reales.
- Baseline actual (código 0c21aa0, sin las optimizaciones de los tickets 04-06): full dashboard da ~13-14 long tasks (hasta ~127ms), max frame gap ~200ms → ROJO. `--focus year-calendar` también es rojo (~8 long tasks, gap ~100ms); `--focus weekly-schedule` da verde (0 long tasks, gap ~17ms). El harness discrimina correctamente.
- Se agregó `playwright.config.ts` + `tests/perf/perf.spec.ts` (CI): corre la animación y falla si no cumple el budget. Se corre con `npm run test:perf` (playwright test). Vitest no lo pilla (include solo `src/**/*.test.ts`/`.spec.ts`).
- Cómo correr: `npm run perf:resize` (script de diagnóstico) o `npm run test:perf` (assertion CI). Documentación completa en el header de `scripts/perf-resize.mjs`.
- Constantes compartidas del harness (viewport, pasos, budget) en `tests/perf/perf-constants.mjs`: driver y spec las importan del mismo lugar para que la calibración del ticket 06 toque un solo archivo.
- Nota: el stub cubre los comandos reales usados al boot (list_habits, list_logs_in_range, list_tasks, list_goals, list_goal_logs_in_range, list_schedule_blocks, list_schedule_slots, save_config, load_config, plugin:event|*). Los `plugin:event|listen`/`unlisten` son no-ops a propósito: la app solo escucha deep-link/oauth, que no aplica al dashboard; los eventos no se entregan (`runCallback` nunca se invoca).
