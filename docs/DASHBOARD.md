# Dashboard Personalizable

## Estado actual

El dashboard de AEON es una grilla nativa de CSS de 12×10 con widgets independientes. El usuario puede activar el modo edición desde la sidebar, mover y redimensionar widgets, ocultarlos o restaurar el layout por defecto.

El layout no usa JS en el loop de resize: cada widget se posiciona con `grid-column` / `grid-row` en enteros sobre un contenedor `display: grid` (`repeat(12, 1fr)` / `repeat(10, 1fr)`, `gap: 4px`). El navegador reparte el espacio; JS solo interviene al soltar un gesto (snap a celda + animación FLIP transform-only). Ver `docs/adr/0004-dashboard-css-grid-nativo-presupuesto-ci.md`.

## Arquitectura

```text
App.vue
├── Sidebar.vue
└── Main Content Area
    └── DashboardView.vue
        ├── GridItemVue.vue
        └── widgets registrados en src/lib/dashboardWidgets.ts
```

El store `src/stores/dashboard.ts` mantiene el layout (enteros) y expone las operaciones de mover, redimensionar, agregar, quitar y restaurar widgets. `src/stores/ui.ts` mantiene el modo de edición y la vista activa.

## Geometría

Cada widget se guarda con posición y tamaño enteros en la grilla de 12 columnas × 10 filas:

```ts
interface LayoutItem {
  i: string;
  x: number; // 0..COLS-w
  y: number; // 0..ROWS-h
  w: number; // 1..12
  h: number; // 1..10
  minW?: number;
  minH?: number;
}
```

El contenedor es `display: grid` con `grid-template-columns: repeat(12, 1fr)`, `grid-template-rows: repeat(10, 1fr)` y `gap: 4px`. Cada widget se posiciona con `grid-column: x+1 / span w` y `grid-row: y+1 / span h` (via `GridItemVue`). La migración desde el modelo viejo en porcentajes redondea (`round(xPercent*12)`, etc.), limita al rango y resuelve colisiones post-redondeo con `findFreePosition` (ver `migratePercentToInteger` en el store).

## Interacción

- El drag y resize se habilitan únicamente en modo edición.
- `interactjs` entrega posición y tamaño en píxeles durante el gesto (el widget se mueve con `transform` / se redimensiona con px absolutos).
- Al soltar, `gridSnap` (`pxToCells`) convierte a celdas enteras y el widget vuelve a la grilla nativa.
- La animación FLIP (transform-only, ~180ms, `cubic-bezier(0.16,1,0.3,1)`) suaviza el snap final (ver `src/composables/flip.ts`).
- Los ítems de la grilla usan `contain: layout paint` para acotar el costo de layout/paint.
- El store valida, clampa y rechaza colisiones reales (acepta bordes tocándose), y persiste cada cambio.
- El botón de reset restaura las posiciones declaradas por cada widget.
- `WidgetPicker` controla qué widgets están visibles.

## Rendimiento

El resize fluido está protegido por un presupuesto de rendimiento medido en CI: `npm run test:perf` anima el viewport de 800×600 a 1920×1080 con el IPC de Tauri stubeado y verifica long tasks, gaps de frame y settle contra los umbrales de `tests/perf/perf-constants.mjs`. El dashboard completo usa un fixture sin overlaps. Es requisito del Definition of Done para cambios que toquen el dashboard o la grilla.

Widgets pesados (calendario anual, heatmap de hábitos) acotan su recompute: el calendario rAF-throttle + tamaño de celda cuantizado (CSS vars, sin re-render por escala) y `content-visibility: auto` en meses fuera de viewport; el heatmap re-computa columnas por ResizeObserver.

## Persistencia

El layout se guarda en la tabla SQLite `config`, no en `localStorage`.

```text
key: aeon-dashboard-layout
value: JSON del layout validado
```

Las instalaciones anteriores guardan la clave `habitos-dashboard-layout`. La migración 007 la renombra automáticamente y el store mantiene un fallback de lectura para instalaciones parcialmente migradas. Los layouts guardados en el modelo viejo (porcentajes) se migran a enteros al cargar.

## Design system

Los estilos usan los tokens definidos en `docs/DESIGN.md` y las clases de Tailwind existentes. No agregar otra librería de grid ni colores arbitrarios para modificar este sistema.

## Archivos relacionados

- `src/components/dashboard/DashboardView.vue`: composición y render del dashboard (contenedor CSS Grid).
- `src/components/dashboard/GridItemVue.vue`: item de la grilla, gestos (drag/resize) y animación FLIP.
- `src/composables/gridSnap.ts`: conversión px → celdas enteras al soltar un gesto.
- `src/composables/flip.ts`: animación FLIP transform-only.
- `src/lib/grid.ts`: constantes `COLS` (12) y `ROWS` (10).
- `src/stores/dashboard.ts`: estado, validación, migración y persistencia del layout.
- `src/stores/dashboard.test.ts`: comportamiento del store.
- `src/lib/dashboardWidgets.ts`: registro y metadatos de widgets.
- `src/components/dashboard/`: contenedores y controles de widgets.
- `tests/perf/`: harness de rendimiento (fixture, métricas, presupuesto).
- `scripts/perf-resize.mjs`: driver de diagnóstico del resize (no es el test).
