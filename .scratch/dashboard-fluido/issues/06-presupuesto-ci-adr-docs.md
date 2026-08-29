# 06: Presupuesto en CI + ADR + docs

**What to build:** el harness de rendimiento se endurece como test con umbral (`npm run test:perf`) que corre en CI y falla si un cambio reintroduce jank en el resize del dashboard. Se documenta la decisión de arquitectura (ADR) y se integra `test:perf` al Definition of Done del proyecto. La aceptación final incluye el chequeo manual del repro original en `npm run tauri dev`.

**Blocked by:** 03, 04, 05 (endurece y documenta el resultado de las tres).

**Status:** ready-for-human

- [x] El harness de 01 se convierte en test con umbral: long tasks >50ms, gap máximo entre frames y settle acotados, calibrados sobre la línea base.
- [x] Existe `npm run test:perf` y se puede correr de forma aislada y determinista.
- [x] `test:perf` se integra al Definition of Done de AGENTS.md, como requisito para cambios que toquen el dashboard o la grilla (no para todo PR).
- [x] Se escribe un ADR que documenta la decisión: CSS Grid nativo con enteros, sin JS en el loop de layout, y el presupuesto de rendimiento en CI.
- [x] Se actualiza la documentación de arquitectura/design si corresponde (tokens de motion, gap 4px).
- [ ] Verificación manual en `npm run tauri dev`: maximizar y arrastrar el borde de la ventana se percibe fluido (repro original del usuario).
- [x] `npm run build`, `npm run test` y `npm run test:perf` pasan.

## Comments

- El harness de 01 (`tests/perf/perf.spec.ts` + `page-metrics.js` + `inject-stub.js`) queda como test con umbral: `npm run test:perf` corre Playwright/Chromium aislado y determinista (1 worker, webServer propio en 1420, IPC de Tauri stubeado).
- Los umbrales viven en `tests/perf/perf-constants.mjs` (single source, calibrados sobre la línea base del dashboard completo con fixture **sin overlaps**).
- La línea base (fixture sin overlaps, `inject-stub.js` DEFAULT_LAYOUT): 14 long tasks >50ms, gap máximo ~233ms, settle ~106ms. Los dos widgets pesados (calendario anual ~9 LT y heatmap de hábitos ~6 LT en tamaños de fixture) son layout nativo del navegador sobre cientos de celdas — reescribir la lógica interna de esos widgets es Out of Scope del spec. Presupuesto = baseline + headroom (longTasks ≤20, gap <300ms, settle <350ms).
- Fixture: `DEFAULT_LAYOUT` de `inject-stub.js` se corrigió a un layout sin overlaps (perf-only, no toca el default real de la app que sigue solapando year-calendar + weekly-schedule en fila 7).
- Se corrigió `scripts/perf-resize.mjs` para pasar `--perfLayout` a los params del stub (antes solo pasaba `perfFocus`, el flag se ignoraba).
- ADR: `docs/adr/0004-dashboard-css-grid-nativo-presupuesto-ci.md`.
- Docs: `docs/DASHBOARD.md` reescrito al modelo grid-native (estaba desactualizado: hablaba de percent floats + useDashGrid + applyGapToPixel); `docs/DESIGN.md` ganó sección Motion (FLIP snap ~180ms, scroll anual 400ms, easing único `cubic-bezier(0.16,1,0.3,1)`, nunca animar width/height/top/left) y el token del gap 4px del dashboard.
- `AGENTS.md`: `test:perf` en comandos, sección de presupuesto de rendimiento, y DoD item 7 (obligatorio solo para cambios que toquen dashboard o grilla).
- `npm run test:perf` verde en 16 corridas consecutivas (determinista). `npm run build` y `npm run test` (704 tests) verdes.
- Verificación manual: pendiente del usuario en `npm run tauri dev` (maximizar y arrastrar el borde de la ventana).
