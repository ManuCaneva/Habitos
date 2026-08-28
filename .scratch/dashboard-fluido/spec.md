# Spec: Dashboard fluido — CSS Grid nativo sin JS en el loop de resize

Status: ready-for-agent

## Problem Statement

Al cambiar el tamaño de la ventana (por ejemplo, maximizar o pasar a pantalla completa), el dashboard se siente tosco y lento: el resize se percibe como movimientos bruscos y tarda en acomodarse. En cambio, mover la ventana sin cambiar su tamaño no tiene problemas, y mover/redimensionar widgets en modo edición es fluido.

La causa raíz es que la posición y el tamaño de cada widget se calculan en JavaScript en cada frame de resize: un `ResizeObserver` en el contenedor recrea el objeto `dims` (ancho/alto en píxeles), cada `GridItemVue` recomputa su `baseStyle` en píxeles reactivamente, y una transición CSS sobre `left/top/width/height` (propiedades que fuerzan layout) queda activa durante todo el gesto, amplificando el costo. Esto dispara en cascada los `ResizeObserver` internos de los widgets pesados (calendario anual, cronograma semanal), que recomputan y re-renderizan cientos de celdas por frame.

El modo edición es fluido porque el drag escribe estilos directamente y desactiva las transiciones; el resize global no tiene esa protección.

## Solution

Hacer que el navegador resuelva el layout del dashboard, no JavaScript:

1. **CSS Grid nativo con unidades enteras**: la grilla del dashboard pasa a ser `display: grid` con `grid-template-columns: repeat(12, 1fr)` y `grid-template-rows: repeat(10, 1fr)`, y cada widget se posiciona con `grid-column` / `grid-row`. El store guarda enteros `{x, y, w, h}` sobre una grilla 12×10 en lugar de porcentajes flotantes. El resize de la ventana deja de tocar JS por completo: lo resuelve el motor de layout.
2. **Presupuesto de rendimiento en CI**: un harness Playwright que anima el viewport y mide long tasks / gaps de frames / settle time, con umbral rojo/verde. Esto garantiza que el dashboard se mantenga fluido a lo largo del tiempo (cualquier widget futuro que reintroduzca el bug hace fallar el test).
3. **Contención y recompute discreto**: los widgets pesados (calendario anual, cronograma) solo recomputan cuando cambia algo significativo (no por frame), y los grid items aplican `contain` para que el costo interno no se propague.

## User Stories

1. Como usuario, quiero maximizar la ventana y que el dashboard se acomode instantáneamente, sin tartamudeos ni movimientos toscos.
2. Como usuario, quiero cambiar el tamaño de la ventana arrastrando el borde y que los widgets se reacomoden con fluidez mientras arrastro.
3. Como usuario, quiero que mover un widget en modo edición siga siendo tan fluido como ahora (no perder lo que ya funciona).
4. Como usuario, quiero que redimensionar un widget en modo edición sea fluido.
5. Como usuario, quiero que al soltar un widget movido/redimensionado, se acomode visualmente de forma agradable (sin saltos bruscos).
6. Como usuario, quiero que el dashboard conserve mi layout personalizado entre sesiones (la migración no debe perder mi configuración guardada).
7. Como usuario con un layout viejo (de versiones anteriores), quiero que mi layout se migre automáticamente a la nueva grilla sin perder posiciones ni tamaños.
8. Como usuario, quiero que el calendario anual siga mostrando los 12 meses correctamente al redimensionar, sin parpadeos ni estados intermedios rotos.
9. Como usuario, quiero que el cronograma semanal siga funcionando correctamente al redimensionar.
10. Como usuario, quiero poder agregar, quitar y restablecer widgets sin que se rompa la nueva grilla.
11. Como usuario, quiero que los widgets no se solapen al moverlos o redimensionarlos (reglas de colisión intactas).
12. Como usuario, quiero que los widgets no se salgan del contenedor al moverlos o redimensionarlos (clamping intacto).
13. Como usuario, quiero que los widgets tengan el mismo espaciado visual entre sí que antes (gap de 4px).
14. Como desarrollador, quiero un test de rendimiento automatizado que falle si un cambio reintroduce jank en el resize, para poder iterar con confianza.
15. Como desarrollador, quiero que la lógica de la grilla (colisión, clamping, snap, migración) siga cubierta por tests unitarios.
16. Como usuario, quiero que la app siga funcionando sin Tauri (en navegador) para poder correr el harness de rendimiento y los tests.

## Implementation Decisions

### Modelo de datos: enteros sobre grilla 12×10

- El layout pasa de porcentajes flotantes a enteros: `LayoutItem = { i: string, x: number, y: number, w: number, h: number, minW?: number, minH?: number, maxW?: number, maxH?: number }`, con `x`, `w` sobre 12 columnas (0..12) y `y`, `h` sobre 10 filas (0..10).
- `COLS = 12`, `ROWS = 10` como constantes del dominio. El paso de grilla es 1 unidad (no 1/12 ni 1/10).
- La colisión se vuelve aritmética de enteros: dos items se solapan si `x < other.x + other.w && other.x < x + w && y < other.y + other.h && other.y < y + h`. Desaparece el epsilon de punto flotante.
- Los defaults de los widgets se redefinen en celdas enteras (ver sección siguiente).

### Migración de layouts guardados

- El layout persistido en `aeon-dashboard-layout` (y la clave legacy `habitos-dashboard-layout`) hoy está en porcentajes que, por construcción del snap, son múltiplos exactos de 1/12 y 1/10.
- La migración redondea a la celda más cercana: `x = Math.round(xPercent * 12)`, `y = Math.round(yPercent * 10)`, `w = Math.round(wPercent * 12)`, `h = Math.round(hPercent * 10)`, con clamping al contenedor.
- Tras el redondeo, si dos items quedan solapados (caso borde de layouts editados a mano con valores no alineados), se reubica el segundo con `findFreePosition` manteniendo su tamaño.
- Se mantiene el patrón de migración existente: detectar el esquema por el nombre de los campos (`xPercent` vs `x`), igual que la migración legacy `x/y/w/h` → porcentajes que ya existe.
- El layout legacy pre-branding (grid de 12×10 con enteros) ahora migra directamente a enteros sin paso intermedio.

### Render: CSS Grid nativo

- El contenedor del dashboard es `display: grid; grid-template-columns: repeat(12, 1fr); grid-template-rows: repeat(10, 1fr); gap: 4px`.
- Cada widget se posiciona con `grid-column: x + 1 / span w; grid-row: y + 1 / span h`.
- El `gap: 4px` reemplaza `applyGapToPixel` (que resta 4px y suma 2px de inset). Visualmente equivalente.
- Muere la prop `dims`, el `ResizeObserver` del contenedor, el `baseStyle` reactivo y el recálculo de píxeles en `useDashGrid`. `useMonitorChange` se elimina por completo (era un disparador redundante de recalc).
- `GridItemVue` se simplifica: recibe el item y el modo edición, y emite `moved`/`resized` en unidades enteras. Sin dependencias de dimensiones del contenedor.

### Gestos en modo edición (conservar lo fluido, mejorar lo posible)

- **Drag**: durante el arrastre se aplica `transform: translate(dx, dy)` sobre el elemento (compositor puro, sin layout), en lugar de escribir `left/top`. Al soltar se hace snap a celda entera y se emite el nuevo `{x, y}`.
- **Resize**: durante el gesto se posiciona el elemento en `position: absolute` con ancho/alto en píxeles (como hoy), para poder redimensionar libremente; al soltar se hace snap a celda entera y se emite el nuevo `{w, h}`.
- El snap a celda lee el tamaño del contenedor una única vez al soltar (no reactivamente): `columnWidth = containerWidth / 12`, `rowHeight = containerHeight / 10`, y redondea `px / cell`.
- Las reglas de colisión y clamping se mantienen en el store (misma semántica que hoy, ahora en enteros).
- Durante el gesto NO hay transiciones (igual que hoy con `grid-item--dragging`).

### Animación al soltar (FLIP, compositor puro)

- Al soltar un drag o resize, se aplica una animación FLIP con `transform` (nunca `left/top/width/height`): se mide la posición/tamaño antes, se invierte con un `transform`, y se anima a cero con un easing consistente (~150-200ms).
- Se reutiliza el vocabulario de motion del proyecto. Hoy el único token de animación es `fade-in 200ms ease-out`; se agrega un easing para el FLIP alineado con DESIGN.md.

### Contención y recompute discreto en widgets pesados

- Los grid items aplican `contain: layout paint` (el widget ya es `overflow: hidden`), de modo que el costo de layout interno no se propaga al resto del dashboard.
- Calendario anual (`YearCalendarWidget`): el recompute se acota por rAF y solo actualiza el estado si cambió algo significativo (número de columnas, slots visibles, tamaño de celda en pasos discretos). Las celdas escalan por CSS var sin re-render de Vue; los meses fuera del viewport aplican `content-visibility: auto`.
- Cronograma semanal (`WeeklyScheduleGrid`): el `measure()` se acota por rAF.

### Presupuesto de rendimiento (harness Playwright)

- Se agrega Playwright (solo Chromium) como devDependency, con un script de diagnóstico (`scripts/perf-resize.mjs`) y un test de presupuesto (`tests/perf/`).
- El harness: sirve la app (vite), stubba el IPC de Tauri para controlar layout y volumen de datos, anima el viewport (800×600 → 1920×1080 en ~1s), e inyecta `PerformanceObserver('longtask')` + medición de gaps de frames + settle time.
- Presupuesto objetivo (a calibrar en la primera corrida sobre el código actual): 0 long tasks >50ms durante la animación, gap máximo entre frames <50ms, settle <250ms tras el último cambio.
- El harness arranca en modo diagnóstico para minimizar el repro (un widget a la vez) y luego se endurece como test con umbral.

## Testing Decisions

**Qué hace un buen test (este proyecto, por AGENTS.md):** testear comportamiento externo observable, no implementación interna. Para los componentes Vue: probar via props/emit, no estado interno. Para el store: lógica pura de dominio. Los tests van al lado del código (`foo.ts` → `foo.test.ts`).

**Módulos a testear:**

- **`src/stores/dashboard.ts`** (prioridad: migración y colisión): migración de porcentajes a enteros (redondeo, clamping, colisiones post-redondeo), migración legacy directa a enteros, colisión por enteros en bordes tocados, `findFreePosition`, `moveTo`/`resizeTo`/`addWidget`/`removeWidget`/`resetLayout` en enteros. Prior art: `src/stores/dashboard.test.ts` actual (reemplazar los casos en porcentajes).
- **`src/composables/`** (nueva lógica de grilla): snap píxel→celda, conversión de unidades. Prior art: `src/composables/useDashGrid.test.ts` (adaptar o reemplazar).
- **`src/components/dashboard/GridItemVue.vue`**: render de `grid-column`/`grid-row` a partir del item, emisión de `moved`/`resized` en enteros, desactivación de transición durante el gesto. Prior art: `src/components/dashboard/DashboardView.test.ts` (mocks de `useDashGrid`/`useDashDrag`).
- **`src/components/dashboard/DashboardView.vue`**: renderiza GridItemVue por item sin `dims`; el contenedor es grid.
- **Harness de rendimiento** (`tests/perf/`): presupuesto de long tasks / gaps / settle durante un resize animado. Este es un test de regresión de rendimiento, distinto a los unitarios; corre aparte (`npm run test:perf`).

**Seams:** el seam principal sigue siendo el store (`dashboard.ts`) + los composables de grilla. No se agregan seams nuevos: se reutiliza el mock de `@/lib/db` existente (con `loadConfig`/`saveConfig`) para la migración, y el mock de `@tauri-apps/api` para el harness.

## Out of Scope

- Reescribir la lógica interna de los widgets (calendario, cronograma, hábitos, tareas, objetivos): solo se acota su recompute y se aplica contención; su lógica de dominio no cambia.
- Cambiar el motor de drag (se sigue usando interact.js).
- Cambiar la persistencia en Rust/SQLite (el layout se guarda igual, solo cambia el formato del JSON).
- Usar una librería de grid (vue-grid-layout, etc.): el bug es de límites mal puestos, no de falta de features, y una dependencia de UI nueva no se agrega sin discusión.
- Virtualización completa de listas de hábitos/tareas/objetivos (quedan como mejora futura).
- Optimizaciones específicas de WebKitGTK más allá de quitar JS del loop de layout.

## Further Notes

- Regla de oro del proyecto (AGENTS.md): la lógica de grilla vive en TypeScript, no en Rust. Este cambio es 100% frontend.
- El harness de rendimiento corre contra el navegador (Chromium) como proxy del mecanismo; la aceptación final incluye un chequeo manual en `npm run tauri dev` (el repro original del usuario).
- `npm run test:perf` pasa a ser parte del Definition of Done para cambios que toquen el dashboard o la grilla (no para todo PR, para mantener el CI rápido).
