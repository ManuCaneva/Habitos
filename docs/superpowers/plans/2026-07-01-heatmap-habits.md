# Heatmap de Hábitos - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar la vista horizontal de hábitos con un layout vertical tipo heatmap de GitHub, pegado al sidebar, con grilla 7x5 mostrando los últimos 30 días por hábito.

**Architecture:** Se crean tres nuevos componentes: `buildHeatmapGrid.ts` (función pura en `src/lib/`), `HeatmapGrid.vue` (componente visual), y `HabitCard.vue` (reemplaza `HabitRow` en `TodayView`). `HabitRow` se mantiene para `ArchivedView`. El panel se pega al sidebar quitando `max-w-2xl mx-auto`.

**Tech Stack:** Vue 3.5, TypeScript, Pinia, Tailwind 3.4, Vitest, @vue/test-utils

## Global Constraints

- **TDD estricto**: escribir test primero, confirmar que falla, implementar mínimo, confirmar que pasa
- **Lógica en TypeScript**: toda la lógica de negocio (cálculo de grilla, fechas) vive en `src/lib/`, no en componentes Vue
- **Tokens de DESIGN.md**: usar solo tokens de Tailwind configurados (`bg-surface-1`, `border-hairline`, `rounded-lg`, etc.), no hardcodear colores/tamaños
- **Sin comentarios**: no agregar TODOs, código comentado, o lógica muerta
- **Tests desacoplados**: mockear `@/lib/db` con `vi.mock()`, no levantar Tauri en tests unitarios

---

## File Structure

```
src/
  lib/
    buildHeatmapGrid.ts          # NUEVO: función pura que genera estructura de grilla
    buildHeatmapGrid.test.ts     # NUEVO: tests de la función pura
  components/
    habits/
      HeatmapGrid.vue            # NUEVO: componente visual de grilla
      HeatmapGrid.test.ts        # NUEVO: tests del componente
      HabitCard.vue              # NUEVO: reemplaza HabitRow en TodayView
      HabitCard.test.ts          # NUEVO: tests del componente
      HabitRow.vue               # EXISTENTE: se mantiene para ArchivedView
      HabitList.vue              # EXISTENTE: se mantiene
  views/
    TodayView.vue                # MODIFICAR: usar HabitCard en vez de HabitList, quitar centrado
```

---

### Task 1: buildHeatmapGrid - Función pura

**Files:**
- Create: `src/lib/buildHeatmapGrid.ts`
- Test: `src/lib/buildHeatmapGrid.test.ts`

**Interfaces:**
- Consumes: `HabitLog[]` (de `src/schemas/habits.ts`)
- Produces: `GridCell[]` donde `GridCell = { date: string; completed: boolean; isEmpty: boolean }`

- [ ] **Step 1: Write the failing test**

```typescript
// src/lib/buildHeatmapGrid.test.ts
import { describe, it, expect } from "vitest";
import { buildHeatmapGrid } from "./buildHeatmapGrid";
import type { HabitLog } from "@/schemas/habits";

describe("buildHeatmapGrid", () => {
  it("genera 35 celdas para 30 días (7x5)", () => {
    const logs: HabitLog[] = [];
    const cells = buildHeatmapGrid(30, logs);
    expect(cells).toHaveLength(35);
  });

  it("marca celdas como completadas según logs", () => {
    const logs: HabitLog[] = [
      {
        id: "1",
        habit_id: "h1",
        log_date: "2026-06-25",
        completed_at: "2026-06-25T10:00:00.000Z",
        note: null,
        created_at: "2026-06-25T10:00:00.000Z",
      },
    ];
    const cells = buildHeatmapGrid(30, logs);
    const completedCells = cells.filter((c) => c.completed);
    expect(completedCells.length).toBeGreaterThan(0);
  });

  it("hoy cae en la esquina inferior derecha", () => {
    const logs: HabitLog[] = [];
    const cells = buildHeatmapGrid(30, logs);
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;
    
    const lastCell = cells[cells.length - 1];
    expect(lastCell.date).toBe(todayStr);
    expect(lastCell.isEmpty).toBe(false);
  });

  it("celdas fuera del rango están vacías", () => {
    const logs: HabitLog[] = [];
    const cells = buildHeatmapGrid(30, logs);
    const emptyCells = cells.filter((c) => c.isEmpty);
    expect(emptyCells.length).toBeGreaterThan(0);
  });

  it("respeta prop days (60 días)", () => {
    const logs: HabitLog[] = [];
    const cells = buildHeatmapGrid(60, logs);
    expect(cells.length).toBeGreaterThan(35);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test src/lib/buildHeatmapGrid.test.ts`
Expected: FAIL with "Cannot find module './buildHeatmapGrid'"

- [ ] **Step 3: Write minimal implementation**

```typescript
// src/lib/buildHeatmapGrid.ts
import type { HabitLog } from "@/schemas/habits";

export interface GridCell {
  date: string;
  completed: boolean;
  isEmpty: boolean;
}

function getTodayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  return d.getDay();
}

function getWeekIndex(dateStr: string, startDate: string): number {
  const start = new Date(startDate + "T00:00:00");
  const current = new Date(dateStr + "T00:00:00");
  const diffDays = Math.floor(
    (current.getTime() - start.getTime()) / 86_400_000
  );
  return Math.floor(diffDays / 7);
}

export function buildHeatmapGrid(days: number, logs: HabitLog[]): GridCell[] {
  const today = getTodayDate();
  const todayDate = new Date(today + "T00:00:00");
  const startDate = new Date(todayDate);
  startDate.setDate(startDate.getDate() - (days - 1));
  
  const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}-${String(startDate.getDate()).padStart(2, "0")}`;
  
  const completedDates = new Set(logs.map((l) => l.log_date));
  
  const totalWeeks = Math.ceil(days / 7);
  const totalCells = totalWeeks * 7;
  
  const cells: GridCell[] = [];
  
  for (let i = 0; i < totalCells; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;
    
    const isInRange = i >= (totalCells - days);
    
    cells.push({
      date: dateStr,
      completed: isInRange && completedDates.has(dateStr),
      isEmpty: !isInRange,
    });
  }
  
  return cells;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test src/lib/buildHeatmapGrid.test.ts`
Expected: PASS (all 5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/buildHeatmapGrid.ts src/lib/buildHeatmapGrid.test.ts
git commit -m "feat: add buildHeatmapGrid function with tests"
```

---

### Task 2: HeatmapGrid - Componente visual

**Files:**
- Create: `src/components/habits/HeatmapGrid.vue`
- Test: `src/components/habits/HeatmapGrid.test.ts`

**Interfaces:**
- Consumes: `buildHeatmapGrid` (de `src/lib/buildHeatmapGrid.ts`), `HabitLog[]` (de `src/schemas/habits.ts`)
- Produces: componente Vue que renderiza grilla 7x5

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/habits/HeatmapGrid.test.ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HeatmapGrid from "./HeatmapGrid.vue";
import type { HabitLog } from "@/schemas/habits";

describe("HeatmapGrid", () => {
  it("renderiza 35 celdas para 30 días", () => {
    const logs: HabitLog[] = [];
    const wrapper = mount(HeatmapGrid, {
      props: { logs, color: "#5e6ad2", days: 30 },
    });
    const cells = wrapper.findAll("[data-testid='heatmap-cell']");
    expect(cells).toHaveLength(35);
  });

  it("celdas completadas tienen el color del hábito", () => {
    const logs: HabitLog[] = [
      {
        id: "1",
        habit_id: "h1",
        log_date: "2026-06-25",
        completed_at: "2026-06-25T10:00:00.000Z",
        note: null,
        created_at: "2026-06-25T10:00:00.000Z",
      },
    ];
    const wrapper = mount(HeatmapGrid, {
      props: { logs, color: "#5e6ad2", days: 30 },
    });
    const completedCells = wrapper.findAll("[data-testid='heatmap-cell'].completed");
    expect(completedCells.length).toBeGreaterThan(0);
    const style = completedCells[0].attributes("style");
    expect(style).toContain("background-color");
  });

  it("celdas no completadas tienen bg-surface-2", () => {
    const logs: HabitLog[] = [];
    const wrapper = mount(HeatmapGrid, {
      props: { logs, color: "#5e6ad2", days: 30 },
    });
    const nonCompletedCells = wrapper
      .findAll("[data-testid='heatmap-cell']")
      .filter((c) => !c.classes().includes("completed") && !c.classes().includes("empty"));
    expect(nonCompletedCells.length).toBeGreaterThan(0);
    expect(nonCompletedCells[0].classes()).toContain("bg-surface-2");
  });

  it("celdas vacías son transparentes", () => {
    const logs: HabitLog[] = [];
    const wrapper = mount(HeatmapGrid, {
      props: { logs, color: "#5e6ad2", days: 30 },
    });
    const emptyCells = wrapper.findAll("[data-testid='heatmap-cell'].empty");
    expect(emptyCells.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test src/components/habits/HeatmapGrid.test.ts`
Expected: FAIL with "Cannot find module './HeatmapGrid.vue'"

- [ ] **Step 3: Write minimal implementation**

```vue
<!-- src/components/habits/HeatmapGrid.vue -->
<script setup lang="ts">
import { computed } from "vue";
import type { HabitLog } from "@/schemas/habits";
import { buildHeatmapGrid } from "@/lib/buildHeatmapGrid";

const props = withDefaults(
  defineProps<{
    logs: HabitLog[];
    color: string;
    days?: number;
  }>(),
  { days: 30 }
);

const cells = computed(() => buildHeatmapGrid(props.days, props.logs));
const totalWeeks = computed(() => Math.ceil(props.days / 7));
</script>

<template>
  <div
    class="grid gap-1"
    :style="{ gridTemplateColumns: `repeat(${totalWeeks}, minmax(0, 1fr)) }`"
  >
    <div
      v-for="cell in cells"
      :key="cell.date"
      data-testid="heatmap-cell"
      :class="[
        'w-4 h-4 rounded-sm',
        cell.isEmpty ? 'empty' : '',
        cell.completed ? 'completed' : '',
        !cell.isEmpty && !cell.completed ? 'bg-surface-2' : '',
      ]"
      :style="cell.completed ? { backgroundColor: color } : {}"
    />
  </div>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test src/components/habits/HeatmapGrid.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/habits/HeatmapGrid.vue src/components/habits/HeatmapGrid.test.ts
git commit -m "feat: add HeatmapGrid component with tests"
```

---

### Task 3: HabitCard - Componente con check-in

**Files:**
- Create: `src/components/habits/HabitCard.vue`
- Test: `src/components/habits/HabitCard.test.ts`

**Interfaces:**
- Consumes: `HeatmapGrid` (de `src/components/habits/HeatmapGrid.vue`), `useHabitsStore` (de `src/stores/habits.ts`), `useUiStore` (de `src/stores/ui.ts`), `Habit` (de `src/schemas/habits.ts`)
- Produces: componente Vue que renderiza hábito con heatmap y check-in

- [ ] **Step 1: Write the failing test**

```typescript
// src/components/habits/HabitCard.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitCard from "./HabitCard.vue";
import type { Habit } from "@/schemas/habits";

vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => ({
    completedToday: new Set<string>(),
    checkIn: vi.fn(),
    undoCheckIn: vi.fn(),
    getTodayDate: () => "2026-07-01",
  }),
}));

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    menuOpenForHabitId: null,
    toggleMenu: vi.fn(),
  }),
}));

describe("HabitCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const mockHabit: Habit = {
    id: "h1",
    name: "Meditar",
    description: null,
    icon: null,
    color: "#5e6ad2",
    frequency: { type: "daily", target_per_period: 1 },
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    archived_at: null,
  };

  it("renderiza nombre y color del hábito", () => {
    const wrapper = mount(HabitCard, {
      props: { habit: mockHabit, logs: [] },
    });
    expect(wrapper.text()).toContain("Meditar");
    const colorDot = wrapper.find("[data-testid='color-dot']");
    expect(colorDot.exists()).toBe(true);
  });

  it("renderiza botón de check-in", () => {
    const wrapper = mount(HabitCard, {
      props: { habit: mockHabit, logs: [] },
    });
    const checkinButton = wrapper.find("[data-testid='checkin-button']");
    expect(checkinButton.exists()).toBe(true);
  });

  it("renderiza botón de menú", () => {
    const wrapper = mount(HabitCard, {
      props: { habit: mockHabit, logs: [] },
    });
    const menuButton = wrapper.find("[data-testid='menu-button']");
    expect(menuButton.exists()).toBe(true);
  });

  it("renderiza HeatmapGrid", () => {
    const wrapper = mount(HabitCard, {
      props: { habit: mockHabit, logs: [] },
    });
    const heatmap = wrapper.findComponent({ name: "HeatmapGrid" });
    expect(heatmap.exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test src/components/habits/HabitCard.test.ts`
Expected: FAIL with "Cannot find module './HabitCard.vue'"

- [ ] **Step 3: Write minimal implementation**

```vue
<!-- src/components/habits/HabitCard.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { Check, MoreHorizontal } from "lucide-vue-next";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import type { Habit, HabitLog } from "@/schemas/habits";
import Text from "@/components/ui/Text.vue";
import HeatmapGrid from "./HeatmapGrid.vue";

const props = defineProps<{
  habit: Habit;
  logs: HabitLog[];
}>();

const habits = useHabitsStore();
const ui = useUiStore();

const checked = computed(() => habits.completedToday.has(props.habit.id));
const isMenuOpen = computed(() => ui.menuOpenForHabitId === props.habit.id);

async function toggleCheck() {
  const today = habits.getTodayDate();
  if (checked.value) {
    await habits.undoCheckIn(props.habit.id, today);
  } else {
    await habits.checkIn(props.habit.id);
  }
}
</script>

<template>
  <div class="bg-surface-1 rounded-lg border border-hairline p-5">
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span
          data-testid="color-dot"
          :style="{ backgroundColor: habit.color }"
          class="w-3 h-3 rounded-full shrink-0"
          aria-hidden="true"
        />
        <Text variant="body-lg" weight="500">{{ habit.name }}</Text>
      </div>
      <div class="flex items-center gap-2">
        <button
          data-testid="checkin-button"
          type="button"
          :class="[
            'shrink-0 w-7 h-7 rounded-md border flex items-center justify-center',
            'transition-all duration-150 active:scale-95',
            checked
              ? 'bg-primary border-primary text-white'
              : 'border-hairline-strong hover:border-primary',
          ]"
          :aria-label="checked ? 'Desmarcar hábito' : 'Marcar hábito'"
          :title="checked ? 'Desmarcar' : 'Marcar'"
          @click="toggleCheck"
        >
          <Check v-if="checked" :size="16" :stroke-width="3" />
        </button>
        <button
          data-testid="menu-button"
          type="button"
          :class="[
            'shrink-0 w-7 h-7 rounded-md flex items-center justify-center',
            'transition-opacity duration-150',
            'text-ink-tertiary hover:text-ink hover:bg-surface-2',
            isMenuOpen
              ? 'opacity-100 bg-surface-2 text-ink'
              : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
          ]"
          aria-label="Más opciones"
          title="Más opciones"
          @click="ui.toggleMenu(habit.id)"
        >
          <MoreHorizontal :size="16" />
        </button>
      </div>
    </div>
    <HeatmapGrid :logs="logs" :color="habit.color" :days="30" />
  </div>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test src/components/habits/HabitCard.test.ts`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/habits/HabitCard.vue src/components/habits/HabitCard.test.ts
git commit -m "feat: add HabitCard component with check-in and heatmap"
```

---

### Task 4: Modificar TodayView para usar HabitCard

**Files:**
- Modify: `src/views/TodayView.vue`

**Interfaces:**
- Consumes: `HabitCard` (de `src/components/habits/HabitCard.vue`), `useHabitsStore` (de `src/stores/habits.ts`)
- Produces: vista actualizada con layout vertical pegado al sidebar

- [ ] **Step 1: Write the failing test**

```typescript
// src/views/TodayView.test.ts (agregar a tests existentes)
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TodayView from "./TodayView.vue";

vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => ({
    activeHabits: [
      {
        id: "h1",
        name: "Meditar",
        description: null,
        icon: null,
        color: "#5e6ad2",
        frequency: { type: "daily", target_per_period: 1 },
        sort_order: 0,
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-01T00:00:00.000Z",
        archived_at: null,
      },
    ],
    logs: [],
  }),
}));

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    openCreate: vi.fn(),
  }),
}));

describe("TodayView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("usa HabitCard en vez de HabitList", () => {
    const wrapper = mount(TodayView);
    const habitCard = wrapper.findComponent({ name: "HabitCard" });
    expect(habitCard.exists()).toBe(true);
  });

  it("panel no tiene max-w-2xl mx-auto", () => {
    const wrapper = mount(TodayView);
    const panel = wrapper.find("[data-testid='habits-panel']");
    expect(panel.classes()).not.toContain("max-w-2xl");
    expect(panel.classes()).not.toContain("mx-auto");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test src/views/TodayView.test.ts`
Expected: FAIL (HabitCard no existe en TodayView todavía)

- [ ] **Step 3: Write minimal implementation**

```vue
<!-- src/views/TodayView.vue -->
<script setup lang="ts">
import { computed } from "vue";
import { Plus } from "lucide-vue-next";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import HabitCard from "@/components/habits/HabitCard.vue";
import EmptyState from "@/components/habits/EmptyState.vue";
import Text from "@/components/ui/Text.vue";
import IconButton from "@/components/ui/IconButton.vue";

const habits = useHabitsStore();
const ui = useUiStore();

const list = computed(() => habits.activeHabits);
const logs = computed(() => habits.logs);
</script>

<template>
  <div class="w-full max-w-3xl" data-testid="habits-panel">
    <div class="bg-surface-1 rounded-lg border border-hairline">
      <div class="flex items-center justify-between px-5 py-4 border-b border-hairline">
        <Text variant="card-title" weight="500">Hábitos</Text>
        <IconButton
          label="Nuevo hábito"
          variant="ghost"
          size="sm"
          @click="ui.openCreate()"
        >
          <Plus :size="16" />
        </IconButton>
      </div>
      <EmptyState v-if="list.length === 0" />
      <div v-else class="flex flex-col gap-4 p-5">
        <HabitCard
          v-for="habit in list"
          :key="habit.id"
          :habit="habit"
          :logs="logs.filter((l) => l.habit_id === habit.id)"
        />
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test src/views/TodayView.test.ts`
Expected: PASS (all tests)

- [ ] **Step 5: Commit**

```bash
git add src/views/TodayView.vue src/views/TodayView.test.ts
git commit -m "feat: update TodayView to use HabitCard with vertical layout"
```

---

### Task 5: Verificación final

**Files:**
- None (solo verificación)

- [ ] **Step 1: Correr todos los tests**

Run: `npm run test`
Expected: PASS (todos los tests pasan)

- [ ] **Step 2: Correr build**

Run: `npm run build`
Expected: PASS (sin errores de tipos ni build)

- [ ] **Step 3: Verificar visualmente (manual)**

Run: `npm run dev`
Expected:
- Panel de hábitos pegado al sidebar (no centrado)
- Cada hábito muestra nombre + color + check-in + menú + heatmap
- Heatmap es grilla 7x5 con hoy en esquina inferior derecha
- Celdas completadas tienen color del hábito
- Celdas no completadas tienen bg-surface-2
- Botón de check-in funciona

- [ ] **Step 4: Verificar que ArchivedView sigue funcionando**

Run: navegar a "Archivados" en la app
Expected: ArchivedView sigue usando HabitRow (lista horizontal con checkbox)

- [ ] **Step 5: Commit final (si hay ajustes)**

```bash
git add .
git commit -m "chore: final verification and adjustments"
```

---

## Self-Review Checklist

✅ **Spec coverage:** Todos los requisitos del spec están cubiertos:
- Heatmap 7x5 con hoy en esquina inferior derecha ✓
- Celdas binarias con color del hábito ✓
- Panel pegado al sidebar ✓
- Botón check-in entre nombre y menú ✓
- 30 días por defecto, configurable ✓
- HabitRow se mantiene para ArchivedView ✓

✅ **Placeholder scan:** No hay TBDs, TODOs, ni pasos vagos. Todo el código está completo.

✅ **Type consistency:** `GridCell`, `HabitLog`, `Habit` se usan consistentemente en todas las tareas.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-01-heatmap-habits.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
