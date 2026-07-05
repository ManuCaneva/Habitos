# Dashboard Personalizable — Especificación de Diseño

> **Propósito**: Documento técnico completo para implementar un dashboard con drag-and-drop donde cada panel (widget) se puede mover, redimensionar, y el layout se persiste en localStorage. Diseñado para que otra IA pueda detalle la implementación.

---

## 1. Visión General

### Objetivo
Crear un dashboard principal personalizable donde cada sección de productividad (hábitos, y en el futuro tareas, calendario, etc.) sea un "widget" independiente que el usuario puede:
- **Mover** (drag-and-drop)
- **Redimensionar** (resize handles)
- **Reordenar** (los widgets se reorganizan automáticamente)
- **Eliminar** (ocultar widgets que no necesite)

### Restricciones
- **Solo aplica a la dashboard principal**. La sidebar, settings, y archivados NO se incluyen en el grid.
- **Persistencia en localStorage**: El layout se guarda entre sesiones.
- **Sin dependencias pesadas**: Usar `vue-grid-layout` (~15KB) como engine del grid.
- **Seguir el design system de Linear**: Todos los estilos deben usar los tokens de `docs/DESIGN.md`.

### Stack involucrado
- Vue 3.5 + TypeScript + Composition API
- Pinia (state management)
- `vue-grid-layout` (grid engine)
- Tailwind CSS 3.4 (estilos)
- localStorage (persistencia vía VueUse `useStorage`)

---

## 2. Arquitectura

### Diagrama de componentes

```
App.vue
├── Sidebar.vue (sin cambios)
└── Main Content Area (flex-1)
    ├── DashboardView.vue ← NUEVA vista principal
    │   └── GridLayout (vue-grid-layout)
    │       ├── GridItem
    │       │   └── HabitsWidget.vue ← wrapper de TodayView
    │       │       └── TodayView.vue (sin cambios internos)
    │       ├── GridItem
    │       │   └── [FuturoWidget].vue
    │       └── ...
    ├── ArchivedView.vue (sin cambios)
    └── SettingsView.vue (sin cambios)
```

### Flujo de datos

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  localStorage   │────▶│  Pinia Store     │────▶│  DashboardView  │
│  (layout JSON)  │◀────│  (dashboard.ts)  │◀────│  (GridLayout)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

1. **Al iniciar**: Pinia carga el layout desde localStorage
2. **DashboardView** recibe el layout como prop del store
3. **GridLayout** renderiza los widgets en sus posiciones
4. **Al cambiar layout** (drag/resize): GridLayout emite evento → Pinia actualiza → persiste en localStorage
5. **Si no hay layout guardado**: Se usa el layout por defecto

---

## 3. Sistema de Widgets

### Interfaz de Widget

```ts
// src/lib/dashboardWidgets.ts

export interface DashboardWidget {
  id: string              // ID único: 'habits', 'tasks', etc.
  title: string           // Título mostrado en el header del widget
  icon?: string           // Nombre del icono (lucide-vue-next)
  component: Component    // Componente Vue a renderizar
  minWidth: number        // Ancho mínimo en columnas (grid de 12)
  minHeight: number       // Alto mínimo en filas
  defaultX: number        // Posición por defecto: columna (0-11)
  defaultY: number        // Posición por defecto: fila
  defaultW: number        // Ancho por defecto en columnas
  defaultH: number        // Alto por defecto en filas
}
```

### Registro de widgets

```ts
// src/lib/dashboardWidgets.ts

import type { DashboardWidget } from './dashboardWidgets'
import HabitsWidget from '@/components/dashboard/HabitsWidget.vue'

export const widgets: DashboardWidget[] = [
  {
    id: 'habits',
    title: 'Hábitos',
    icon: 'check-circle',
    component: HabitsWidget,
    minWidth: 4,
    minHeight: 2,
    defaultX: 0,
    defaultY: 0,
    defaultW: 12,
    defaultH: 4,
  },
  // Futuro:
  // { id: 'tasks', title: 'Tareas', component: TasksWidget, minWidth: 4, ... },
  // { id: 'calendar', title: 'Calendario', component: CalendarWidget, minWidth: 6, ... },
]

export function getWidgetById(id: string): DashboardWidget | undefined {
  return widgets.find(w => w.id === id)
}
```

### Agregar un widget nuevo (futuro)

1. Crear el componente Vue en `src/components/dashboard/`
2. Agregar entrada al array `widgets` en `dashboardWidgets.ts`
3. El widget aparece automáticamente en el dashboard

---

## 4. State Management

### Store de Pinia

```ts
// src/stores/dashboard.ts

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useStorage } from '@vueuse/core'
import type { Layout } from 'vue-grid-layout'
import { widgets, getWidgetById } from '@/lib/dashboardWidgets'

// Persistencia en localStorage
const STORAGE_KEY = 'habitos-dashboard-layout'

// Layout por defecto: hábitos ocupa todo el ancho
function getDefaultLayout(): Layout {
  const defaultWidget = widgets[0] // habits
  return {
    columns: 12,
    rowHeight: 80,
    items: [
      {
        i: defaultWidget.id,
        x: defaultWidget.defaultX,
        y: defaultWidget.defaultY,
        w: defaultWidget.defaultW,
        h: defaultWidget.defaultH,
      },
    ],
  }
}

export const useDashboardStore = defineStore('dashboard', () => {
  // Layout persistido
  const savedLayout = useStorage<Layout | null>(STORAGE_KEY, null)

  // Estado activo
  const layout = ref<Layout>(savedLayout.value ?? getDefaultLayout())

  // Widgets visibles (los que están en el layout)
  const visibleWidgets = computed(() => {
    return layout.value.items
      .map(item => {
        const widget = getWidgetById(item.i)
        return widget ? { ...widget, layoutItem: item } : null
      })
      .filter(Boolean)
  })

  // Persistir cuando cambia
  function updateLayout(newLayout: Layout) {
    layout.value = newLayout
    savedLayout.value = newLayout
  }

  // Agregar widget al layout
  function addWidget(widgetId: string) {
    const widget = getWidgetById(widgetId)
    if (!widget) return
    if (layout.value.items.some(item => item.i === widgetId)) return // ya existe

    layout.value.items.push({
      i: widget.id,
      x: widget.defaultX,
      y: widget.defaultY,
      w: widget.defaultW,
      h: widget.defaultH,
    })
    savedLayout.value = layout.value
  }

  // Remover widget del layout
  function removeWidget(widgetId: string) {
    layout.value.items = layout.value.items.filter(item => item.i !== widgetId)
    savedLayout.value = layout.value
  }

  // Resetear al layout por defecto
  function resetLayout() {
    layout.value = getDefaultLayout()
    savedLayout.value = layout.value
  }

  return {
    layout,
    visibleWidgets,
    updateLayout,
    addWidget,
    removeWidget,
    resetLayout,
  }
})
```

### Formato de persistencia en localStorage

Key: `habitos-dashboard-layout`

```json
{
  "columns": 12,
  "rowHeight": 80,
  "items": [
    { "i": "habits", "x": 0, "y": 0, "w": 12, "h": 4 }
  ]
}
```

---

## 5. Componentes

### DashboardView.vue

La vista principal que orquesta el grid.

```vue
<template>
  <div class="h-full">
    <GridLayout
      :layout="dashboardStore.layout"
      :col-num="12"
      :row-height="80"
      :is-draggable="true"
      :is-resizable="true"
      :compact-type="'vertical'"
      :margin="[12, 12]"
      @layout-updated="onLayoutUpdated"
    >
      <GridItem
        v-for="item in dashboardStore.layout.items"
        :key="item.i"
        :x="item.x"
        :y="item.y"
        :w="item.w"
        :h="item.h"
        :i="item.i"
      >
        <component :is="getWidgetById(item.i)?.component" />
      </GridItem>
    </GridLayout>
  </div>
</template>
```

### HabitsWidget.vue

Wrapper del TodayView existente para que sea compatible con el grid.

```vue
<template>
  <div class="h-full overflow-auto rounded-xl bg-surface-1 border border-hairline">
    <TodayView />
  </div>
</template>
```

El `TodayView` actual NO se modifica internamente. Solo se envuelve.

---

## 6. Estilos Custom

### Estilos de vue-grid-layout

Los estilos por defecto de `vue-grid-layout` deben ser customizados para matchear el design system de Linear.

```css
/* src/styles/vue-grid-layout.css */

/* Grid layout container */
.vue-grid-layout {
  position: relative;
  width: 100%;
}

/* Grid items */
.vue-grid-item {
  transition: all 200ms ease;
  border-radius: 16px; /* rounded-xl */
}

/* Resize handles */
.vue-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
  bottom: 0;
  right: 0;
  cursor: se-resize;
  background: transparent;
  transition: background 150ms ease;
}

.vue-resizable-handle:hover {
  background: rgba(94, 106, 210, 0.3); /* primary/30 */
}

.vue-resizable-handle::after {
  content: '';
  position: absolute;
  right: 4px;
  bottom: 4px;
  width: 8px;
  height: 8px;
  border-right: 2px solid rgba(94, 106, 210, 0.4);
  border-bottom: 2px solid rgba(94, 106, 210, 0.4);
  border-radius: 0 0 2px 0;
}

/* Drag placeholder (preview during drag) */
.vue-grid-placeholder {
  background: rgba(94, 106, 210, 0.1) !important;
  border: 2px dashed rgba(94, 106, 210, 0.4) !important;
  border-radius: 16px !important;
  opacity: 1 !important;
}

/* Drag preview (ghost element) */
.vue-draggable-drag {
  opacity: 0.8;
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Token mapping

| Elemento vue-grid-layout | Token de DESIGN.md | Valor |
|--------------------------|-------------------|-------|
| Widget border-radius | `{rounded.xl}` | 16px |
| Widget background | `{colors.surface-1}` | surface-1 |
| Widget border | `{colors.hairline}` | 1px hairline |
| Resize handle hover | `{colors.primary}` @ 30% | #5e6ad24d |
| Drag placeholder border | `{colors.primary}` @ 40% | #5e6ad266 |
| Grid gap (margin) | `{spacing.sm}` | 12px |

---

## 7. Responsive

### Breakpoints

`vue-grid-layout` soporta responsive via prop `responsive`. Configurar:

```ts
const breakpoints = {
  lg: 1024,  // Desktop: 12 columnas
  md: 768,   // Tablet: 8 columnas
  sm: 480,   // Mobile: 4 columnas (stack vertical)
}

const cols = {
  lg: 12,
  md: 8,
  sm: 4,
}
```

### Comportamiento por breakpoint

| Breakpoint | Columnas | Comportamiento |
|-----------|----------|----------------|
| Desktop (>1024px) | 12 | Grid horizontal自由, drag & resize completo |
| Tablet (768-1024px) | 8 | Widgets se reorganizan, resize limitado |
| Mobile (<768px) | 4 | Stack vertical automático, sin drag, sin resize |

En mobile, los widgets se apilan verticalmente y el usuario puede scrollear. Los handles de drag/resize se ocultan.

---

## 8. Testing

### Archivos de test

| Archivo | Qué testea | Estrategia |
|---------|-----------|------------|
| `src/stores/dashboard.test.ts` | Store: carga, persistencia, add/remove widget | Mock localStorage con `vi.mock()` |
| `src/lib/dashboardWidgets.test.ts` | Registro: estructura, getWidgetById | Tests unitarios simples |
| `src/components/dashboard/HabitsWidget.test.ts` | Wrapper renderiza TodayView | `@vue/test-utils` mount |
| `src/components/dashboard/DashboardView.test.ts` | Vista carga layout, renderiza widgets | Mock store + `@vue/test-utils` |

### Store tests (ejemplo)

```ts
// src/stores/dashboard.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore } from './dashboard'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    clear: vi.fn(() => { store = {} }),
  }
})()

describe('dashboard store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('localStorage', localStorageMock)
  })

  it('loads default layout when no saved layout exists', () => {
    const store = useDashboardStore()
    expect(store.layout.items).toHaveLength(1)
    expect(store.layout.items[0].i).toBe('habits')
  })

  it('persists layout to localStorage on update', () => {
    const store = useDashboardStore()
    store.updateLayout({ ...store.layout, items: [{ i: 'habits', x: 0, y: 0, w: 6, h: 4 }] })
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('adds widget to layout', () => {
    const store = useDashboardStore()
    // hypothetical: addWidget('tasks')
    // expect(store.layout.items).toHaveLength(2)
  })

  it('removes widget from layout', () => {
    const store = useDashboardStore()
    store.removeWidget('habits')
    expect(store.layout.items).toHaveLength(0)
  })
})
```

### Lo que NO se testea
- Comportamiento interno de `vue-grid-layout` (dependencia externa)
- Drag-and-drop a nivel de browser (complejo de simular, se prueba manualmente)
- Estilos CSS (se verifican visualmente con `npm run dev`)

---

## 9. Manifest de Archivos

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `src/stores/dashboard.ts` | Store de Pinia para el layout del dashboard |
| `src/stores/dashboard.test.ts` | Tests del store |
| `src/lib/dashboardWidgets.ts` | Registro de widgets disponibles |
| `src/lib/dashboardWidgets.test.ts` | Tests del registro |
| `src/components/dashboard/DashboardView.vue` | Vista principal del grid |
| `src/components/dashboard/HabitsWidget.vue` | Wrapper del TodayView |
| `src/components/dashboard/HabitsWidget.test.ts` | Tests del wrapper |
| `src/components/dashboard/DashboardView.test.ts` | Tests de la vista |
| `src/styles/vue-grid-layout.css` | Estilos custom para el grid |

### Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `App.vue` | Agregar `DashboardView` como vista principal del content area, reemplazando la referencia directa a `TodayView` |
| `src/stores/ui.ts` | Agregar `editMode` (boolean, persistido en localStorage) y cambiar `viewMode` default a `'dashboard'` |
| `src/components/layout/Sidebar.vue` | Agregar botón "Modo Edición" encima de "Tema" y "Colapsar" que toggkea `ui.editMode` |
| `package.json` | Agregar dependencia `vue-grid-layout` |
| `tailwind.config.ts` | (Opcional) Agregar tokens si es necesario |

---

## 10. Pasos de Implementación (orden sugerido)

1. **Instalar dependencia**: `npm install vue-grid-layout`
2. **Crear store** (`dashboard.ts`) con persistencia en localStorage
3. **Crear tests del store** y verificar que pasan
4. **Crear registro de widgets** (`dashboardWidgets.ts`)
5. **Crear tests del registro**
6. **Crear HabitsWidget.vue** (wrapper de TodayView)
7. **Crear tests del wrapper**
8. **Crear DashboardView.vue** con GridLayout
9. **Crear estilos custom** (`vue-grid-layout.css`)
10. **Modificar App.vue** para usar DashboardView
11. **Modificar ui.ts** para cambiar viewMode default
12. **Crear tests de DashboardView**
13. **Verificar responsive** con diferentes tamaños de ventana
14. **Correr `npm run build`** para verificar tipos
15. **Correr `npm run test`** para verificar todos los tests

---

## 11. Decisiones Pendientes

- [ ] Confirmar que `vue-grid-layout` funciona correctamente con Vue 3.5 (verificar compatibilidad)
- [x] **Modo Edición**: Se resuelve con un botón "Modo Edición" ubicado en la **Sidebar**, encima de los botones de "Tema" y "Colapsar". Al activarlo, se habilitan el drag & resize de widgets en el dashboard. Al desactivarlo, los widgets quedan fijos (para no moverlos accidentalmente). El estado se persiste en `ui.editMode` (localStorage).
- [ ] Definir si se agrega un botón "agregar widget" en la UI (o solo se agregan por código)
- [ ] Considerar si se necesita un "reset layout" button en settings
