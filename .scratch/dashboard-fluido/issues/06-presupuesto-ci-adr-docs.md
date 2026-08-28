# 06: Presupuesto en CI + ADR + docs

**What to build:** el harness de rendimiento se endurece como test con umbral (`npm run test:perf`) que corre en CI y falla si un cambio reintroduce jank en el resize del dashboard. Se documenta la decisión de arquitectura (ADR) y se integra `test:perf` al Definition of Done del proyecto. La aceptación final incluye el chequeo manual del repro original en `npm run tauri dev`.

**Blocked by:** 03, 04, 05 (endurece y documenta el resultado de las tres).

**Status:** ready-for-agent

- [ ] El harness de 01 se convierte en test con umbral: 0 long tasks >50ms durante la animación, gap máximo entre frames <50ms, settle <250ms (calibrados sobre la línea base).
- [ ] Existe `npm run test:perf` y se puede correr de forma aislada y determinista.
- [ ] `test:perf` se integra al Definition of Done de AGENTS.md, como requisito para cambios que toquen el dashboard o la grilla (no para todo PR).
- [ ] Se escribe un ADR que documenta la decisión: CSS Grid nativo con enteros, sin JS en el loop de layout, y el presupuesto de rendimiento en CI.
- [ ] Se actualiza la documentación de arquitectura/design si corresponde (tokens de motion, gap 4px).
- [ ] Verificación manual en `npm run tauri dev`: maximizar y arrastrar el borde de la ventana se percibe fluido (repro original del usuario).
- [ ] `npm run build`, `npm run test` y `npm run test:perf` pasan.
