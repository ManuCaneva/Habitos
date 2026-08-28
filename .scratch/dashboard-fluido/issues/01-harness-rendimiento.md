# 01: Harness de rendimiento (diagnóstico)

**What to build:** un comando automatizado que reproduce el jank de resize de ventana y lo mide de forma determinista. Sirve la app (vite), stubbea el IPC de Tauri para controlar layout y volumen de datos, anima el viewport (p.ej. 800×600 → 1920×1080 en ~1s) e inyecta `PerformanceObserver('longtask')` + medición de gaps entre frames + settle time. Al correrlo sobre el código actual, produce una línea base **roja** que cuantifica el bug (cuántos long tasks, gap máximo, tiempo de settle). Este es el feedback loop que valida todo lo demás.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Se agrega Playwright (solo Chromium) como devDependency, sin afectar el bundle de producción.
- [ ] Existe un script de diagnóstico que arranca vite, stubbea el IPC de Tauri y anima el viewport.
- [ ] El script inyecta `PerformanceObserver('longtask')`, mide gaps entre frames y settle time tras el último cambio.
- [ ] El script imprime métricas legibles (long tasks >50ms, gap máximo, settle) con un modo "un widget a la vez" para minimizar el repro.
- [ ] Corriendo contra el código actual, la salida muestra claramente el jank (baseline rojo) y no da falsos verdes.
- [ ] Se documenta cómo correrlo (README o comentario del script).
