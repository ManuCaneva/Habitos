# Dashboard Personalizable

## Estado actual

El dashboard de AEON es una grilla de 12 columnas con widgets independientes. El usuario puede activar el modo edición desde la sidebar, mover y redimensionar widgets, ocultarlos o restaurar el layout por defecto.

La implementación actual no usa `vue-grid-layout`. El movimiento y resize se resuelven con `interactjs` y la geometría con el composable `src/composables/useDashGrid.ts`.

## Arquitectura

```text
App.vue
├── Sidebar.vue
└── Main Content Area
    └── DashboardView.vue
        ├── DashboardWidget.vue
        └── widgets registrados en src/lib/dashboardWidgets.ts
```

El store `src/stores/dashboard.ts` mantiene el layout y expone las operaciones de mover, redimensionar, agregar, quitar y restaurar widgets. `src/stores/ui.ts` mantiene el modo de edición y la vista activa.

## Geometría

Cada widget se guarda con posiciones y tamaños relativos al contenedor:

```ts
interface DashboardLayoutItem {
  i: string;
  xPercent: number;
  yPercent: number;
  wPercent: number;
  hPercent: number;
}
```

`useDashGrid` calcula las dimensiones disponibles con `ResizeObserver` y ajusta las operaciones a una grilla virtual de 12 columnas y 10 filas. `snapToGrid` limita los widgets al contenedor y respeta sus tamaños mínimos.

## Interacción

- El drag y resize se habilitan únicamente en modo edición.
- `interactjs` entrega la posición y el tamaño en píxeles.
- `snapToGrid` convierte esos valores a porcentajes y los limita.
- El store actualiza el layout y persiste cada cambio.
- El botón de reset restaura las posiciones declaradas por cada widget.
- `WidgetPicker` controla qué widgets están visibles.

## Persistencia

El layout se guarda en la tabla SQLite `config`, no en `localStorage`.

```text
key: aeon-dashboard-layout
value: JSON del layout validado
```

Las instalaciones anteriores guardan la clave `habitos-dashboard-layout`. La migración 007 la renombra automáticamente y el store mantiene un fallback de lectura para instalaciones parcialmente migradas.

## Design system

Los estilos usan los tokens definidos en `docs/DESIGN.md` y las clases de Tailwind existentes. No agregar otra librería de grid ni colores arbitrarios para modificar este sistema.

## Archivos relacionados

- `src/views/DashboardView.vue`: composición y render del dashboard.
- `src/stores/dashboard.ts`: estado, validación y persistencia del layout.
- `src/stores/dashboard.test.ts`: comportamiento del store.
- `src/composables/useDashGrid.ts`: cálculo de dimensiones y snap.
- `src/composables/useDashGrid.test.ts`: casos de geometría.
- `src/lib/dashboardWidgets.ts`: registro y metadatos de widgets.
- `src/components/dashboard/`: contenedores y controles de widgets.
