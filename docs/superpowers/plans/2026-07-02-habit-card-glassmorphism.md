# Habit Card Glassmorphism Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans`. Steps use `- [ ]` checkboxes.

**Goal:** Render each today-habit as a translucent glassmorphism card with a white Lucide line icon, title + streak subtitle, a shape-shifting state button, and a GitHub-style progress mesh — plus complete the broken edit/archive interactions.

**Architecture:** Pure-TS logic (lib + store) feeds Vue components; Rust untouched. Grid logic transposes to weeks-as-columns; a curated icon set + color-shade helper are new pure modules; `HabitCard` is rewritten to consume them.

**Tech Stack:** Vue 3.5, TypeScript, Pinia, Zod, Tailwind 3.4, `lucide-vue-next` (already installed), Vitest + `@vue/test-utils` + happy-dom.

## Global Constraints

- Rust/`src-tauri` untouched (golden rule — Rust = I/O only).
- Colors via `HABIT_COLORS`/tokens; no hardcoded hex in components (inline `habit.color` is the per-habit value, allowed as today).
- TDD: co-located `*.test.ts`, isolated, `@/lib/db` mocked in store tests, stores mocked in component tests.
- `@/*` → `src/*`. Commands: `npm run test`, `npm run build`.
- Grid: 13 weeks (91 days), display-only, no labels.
- Note on "today bottom-right": in true GitHub-style (weekday-aligned), today sits at its weekday row in the **last column**; it is bottom-right only when today is Sunday. This is standard contribution-graph behavior.

## File Structure

- **New:** `src/lib/icons.ts` (+`icons.test.ts`), `src/lib/habitColors.test.ts` (new test file for existing module).
- **Modify:** `src/lib/habitColors.ts`, `src/lib/buildHeatmapGrid.ts` (+test), `src/stores/habits.ts` (+test), `src/schemas/habits.ts`, `src/components/habits/{HabitCard,HeatmapGrid,HabitFormModal,HabitRow}.vue` (+tests), `src/views/TodayView.vue` (+test), `src/styles/tailwind.css`.

---

### Task 1: Glassmorphism utility

**Files:** Modify `src/styles/tailwind.css`.

**Interfaces:** Produces a `.glass` class consumed by `HabitCard` (Task 7) and `TodayView` (Task 10).

- [ ] **Step 1: Add the utility layer + class**

In `src/styles/tailwind.css`, add (in the `@layer components` block, or a new one):

```css
@layer components {
  .glass {
    @apply backdrop-blur-sm bg-surface-2/60 border border-hairline rounded-lg;
  }
}
```

- [ ] **Step 2: Manual verify (config, no TDD)**

Run: `npm run dev` → confirm `.glass` compiles (no PostCSS error). No unit test (config change per AGENTS.md).

- [ ] **Step 3: Commit**

```bash
git add src/styles/tailwind.css
git commit -m "feat(ui): add .glass glassmorphism utility"
```

---

### Task 2: Curated icon set

**Files:** Create `src/lib/icons.ts`, `src/lib/icons.test.ts`.

**Interfaces:** Produces `HABIT_ICONS`, `HabitIcon`, `DEFAULT_HABIT_ICON`, `iconFor(value)` — consumed by `HabitFormModal` (Task 8) and `HabitCard` (Task 7).

- [ ] **Step 1: Write the failing test** — `src/lib/icons.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { HABIT_ICONS, DEFAULT_HABIT_ICON, iconFor } from "./icons";

describe("habit icons", () => {
  it("tiene al menos 24 iconos", () => {
    expect(HABIT_ICONS.length).toBeGreaterThanOrEqual(24);
  });
  it("valores únicos y etiquetas no vacías", () => {
    const values = HABIT_ICONS.map((i) => i.value);
    expect(new Set(values).size).toBe(values.length);
    for (const i of HABIT_ICONS) expect(i.name.length).toBeGreaterThan(0);
  });
  it("DEFAULT_HABIT_ICON es un valor válido", () => {
    expect(HABIT_ICONS.some((i) => i.value === DEFAULT_HABIT_ICON)).toBe(true);
  });
  it("iconFor devuelve el icono por valor", () => {
    const first = HABIT_ICONS[0];
    expect(iconFor(first.value)?.value).toBe(first.value);
  });
  it("iconFor cae en default para null/desconocido", () => {
    expect(iconFor(null)?.value).toBe(DEFAULT_HABIT_ICON);
    expect(iconFor("no-existe")?.value).toBe(DEFAULT_HABIT_ICON);
  });
});
```

- [ ] **Step 2: Run — fails** — `npm run test src/lib/icons.test.ts` → FAIL (module not found).

- [ ] **Step 3: Implement** — `src/lib/icons.ts`

```ts
import {
  Footprints, Languages, BookOpen, Dumbbell, Droplets, Coffee,
  Moon, Bike, Apple, Heart, Brain, PencilLine, Music, Code,
  Wallet, Briefcase, Sprout, Sun, Cigarette, Pizza, Wine,
  AlarmClock, Bath, Phone,
} from "lucide-vue-next";
import type { Component } from "vue";

export interface HabitIcon { value: string; name: string; icon: Component }

export const HABIT_ICONS: HabitIcon[] = [
  { value: "footprints", name: "Caminar", icon: Footprints },
  { value: "languages", name: "Idioma", icon: Languages },
  { value: "book", name: "Leer", icon: BookOpen },
  { value: "dumbbell", name: "Gimnasio", icon: Dumbbell },
  { value: "droplets", name: "Agua", icon: Droplets },
  { value: "coffee", name: "Café", icon: Coffee },
  { value: "moon", name: "Dormir", icon: Moon },
  { value: "bike", name: "Bici", icon: Bike },
  { value: "apple", name: "Comer sano", icon: Apple },
  { value: "heart", name: "Salud", icon: Heart },
  { value: "brain", name: "Mente", icon: Brain },
  { value: "pencil", name: "Escribir", icon: PencilLine },
  { value: "music", name: "Música", icon: Music },
  { value: "code", name: "Programar", icon: Code },
  { value: "wallet", name: "Ahorrar", icon: Wallet },
  { value: "briefcase", name: "Trabajo", icon: Briefcase },
  { value: "sprout", name: "Plantar", icon: Sprout },
  { value: "sun", name: "Sol", icon: Sun },
  { value: "no-smoke", name: "Sin fumar", icon: Cigarette },
  { value: "pizza", name: "Cocinar", icon: Pizza },
  { value: "wine", name: "Sin alcohol", icon: Wine },
  { value: "alarm", name: "Madrugar", icon: AlarmClock },
  { value: "bath", name: "Higiene", icon: Bath },
  { value: "phone", name: "Sin pantalla", icon: Phone },
];

export const DEFAULT_HABIT_ICON = "footprints";

export function iconFor(value: string | null): HabitIcon {
  return HABIT_ICONS.find((i) => i.value === value)
    ?? HABIT_ICONS.find((i) => i.value === DEFAULT_HABIT_ICON)!;
}
```

- [ ] **Step 4: Run — passes** — `npm run test src/lib/icons.test.ts` → PASS.

- [ ] **Step 5: Commit** — `feat(lib): add curated habit icon set`

---

### Task 3: Color shade helper

**Files:** Modify `src/lib/habitColors.ts`, create `src/lib/habitColors.test.ts`.

**Interfaces:** Produces `shadeFor(color, intensity)` — consumed by `HeatmapGrid` (Task 6).

- [ ] **Step 1: Failing test** — `src/lib/habitColors.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { shadeFor } from "./habitColors";

describe("shadeFor", () => {
  it("intensity 1 → color al 100%", () => {
    expect(shadeFor("#5e6ad2", 1)).toBe("rgba(94, 106, 210, 1)");
  });
  it("intensity 0 → color al 15%", () => {
    expect(shadeFor("#5e6ad2", 0)).toBe("rgba(94, 106, 210, 0.15)");
  });
  it("maneja color sin #", () => {
    expect(shadeFor("5e6ad2", 1)).toBe("rgba(94, 106, 210, 1)");
  });
});
```

- [ ] **Step 2: Run — fails** (export not found).

- [ ] **Step 3: Implement** — append to `src/lib/habitColors.ts`

```ts
export function shadeFor(color: string, intensity: 0 | 1): string {
  const hex = color.replace("#", "");
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const alpha = intensity === 1 ? 1 : 0.15;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
```

- [ ] **Step 4: Run — passes.**

- [ ] **Step 5: Commit** — `feat(lib): add shadeFor color intensity helper`

---

### Task 4: buildHeatmapGrid GitHub transpose

**Files:** Modify `src/lib/buildHeatmapGrid.ts` (+ update `buildHeatmapGrid.test.ts`).

**Interfaces:** Produces `buildHeatmapGrid(days, logs): GridCell[]` in **column-major (week) order**, Mon-top weekday alignment, today in last column at its weekday row. Consumed by `HeatmapGrid` (Task 6).

- [ ] **Step 1: Rewrite the test** — `src/lib/buildHeatmapGrid.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { buildHeatmapGrid } from "./buildHeatmapGrid";
import type { HabitLog } from "@/schemas/habits";

describe("buildHeatmapGrid (GitHub-style)", () => {
  it("genera 91 celdas para 91 días (13x7)", () => {
    expect(buildHeatmapGrid(91, [])).toHaveLength(91);
  });
  it("ordena column-major: cada bloque de 7 = una semana", () => {
    const cells = buildHeatmapGrid(91, []);
    // primer bloque = primera columna (semana más antigua), 7 celdas
    expect(cells.slice(0, 7)).toHaveLength(7);
  });
  it("hoy está en la última columna (últimas 7 celdas)", () => {
    const cells = buildHeatmapGrid(91, []);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const lastWeek = cells.slice(-7);
    expect(lastWeek.some((c) => c.date === todayStr)).toBe(true);
  });
  it("marca completadas según logs", () => {
    const today = new Date().toISOString().slice(0, 10);
    const logs: HabitLog[] = [{
      id: "1", habit_id: "h1", log_date: today,
      completed_at: today, note: null, created_at: today,
    }];
    const cells = buildHeatmapGrid(91, logs);
    expect(cells.filter((c) => c.completed).length).toBeGreaterThanOrEqual(1);
  });
  it("alinea por weekday: fila 0 = lunes", () => {
    const cells = buildHeatmapGrid(91, []);
    // la primera celda de la primera columna debe ser lunes
    expect(new Date(cells[0].date).getDay()).toBe(1); // Monday
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement** — rewrite `src/lib/buildHeatmapGrid.ts`

```ts
import type { HabitLog } from "@/schemas/habits";

export interface GridCell { date: string; completed: boolean; isEmpty: boolean }

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildHeatmapGrid(days: number, logs: HabitLog[]): GridCell[] {
  const completed = new Set(logs.map((l) => l.log_date));
  const totalWeeks = Math.ceil(days / 7);
  const totalCells = totalWeeks * 7;

  // start at the Monday of the week (totalWeeks-1) weeks before today's week
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayDow = (today.getDay() + 6) % 7; // 0=Mon..6=Sun
  const start = new Date(today);
  start.setDate(start.getDate() - ((totalWeeks - 1) * 7) - todayDow);

  const cells: GridCell[] = [];
  // column-major: outer = week, inner = day-of-week (Mon..Sun)
  for (let w = 0; w < totalWeeks; w++) {
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + w * 7 + d);
      const dateStr = toLocalDateStr(cellDate);
      const inRange = cellDate <= today;
      cells.push({
        date: dateStr,
        completed: inRange && completed.has(dateStr),
        isEmpty: !inRange,
      });
    }
  }
  return cells;
}
```

- [ ] **Step 4: Run — passes.**

- [ ] **Step 5: Commit** — `refactor(lib): transpose buildHeatmapGrid to GitHub weeks-as-columns`

---

### Task 5: Store — 91-day range + streakFor

**Files:** Modify `src/stores/habits.ts`, `src/stores/habits.test.ts`.

**Interfaces:** Produces `streakFor(habitId): number`; `loadInitialData` loads 91 days. Consumed by `HabitCard` (Task 7).

- [ ] **Step 1: Failing test** — add to `src/stores/habits.test.ts`

```ts
describe("habits store - loadInitialData & streak", () => {
  beforeEach(() => { setActivePinia(createPinia()); vi.clearAllMocks(); });

  it("loadInitialData pide rango de 91 días", async () => {
    vi.mocked(db.listLogsInRange).mockResolvedValue([]);
    vi.mocked(db.listHabits).mockResolvedValue([]);
    const store = useHabitsStore();
    await store.loadInitialData();
    const call = vi.mocked(db.listLogsInRange).mock.calls[0];
    const [fromArg, toArg] = call;
    const days = Math.round((new Date(toArg) - new Date(fromArg)) / 86400000) + 1;
    expect(days).toBe(91);
  });

  it("streakFor cuenta días consecutivos", async () => {
    vi.mocked(db.listHabits).mockResolvedValue([{
      id: "h1", name: "X", description: null, icon: null, color: "#5e6ad2",
      frequency: { type: "daily", target_per_period: 1 }, sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z", updated_at: "2026-01-01T00:00:00.000Z", archived_at: null,
    }]);
    const today = new Date().toISOString().slice(0, 10);
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yStr = y.toISOString().slice(0, 10);
    vi.mocked(db.listLogsInRange).mockResolvedValue([
      { id: "a", habit_id: "h1", log_date: today, completed_at: today, note: null, created_at: today },
      { id: "b", habit_id: "h1", log_date: yStr, completed_at: yStr, note: null, created_at: yStr },
    ]);
    const store = useHabitsStore();
    await store.loadInitialData();
    expect(store.streakFor("h1")).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run — fails** (`streakFor` undefined; range still 60).

- [ ] **Step 3: Implement** — in `src/stores/habits.ts`:

  - In `loadInitialData` change `fromDate = today - 60` → `today - 90` (so the span is 91 days inclusive). Concretely, wherever the 60 is, set `const fromDate = new Date(); fromDate.setDate(fromDate.getDate() - 90);` and pass `toDateString` through `listLogsInRange`.
  - Expose streak: add to the store's returned object/getters:

```ts
function streakFor(habitId: string): number {
  return currentStreak(habitId);
}
```

(and export `streakFor` in the `defineStore` return / actions).

- [ ] **Step 4: Run — passes** (full store test file).

- [ ] **Step 5: Commit** — `feat(store): load 91-day log range and expose streakFor`

---

### Task 6: HeatmapGrid component (GitHub orientation)

**Files:** Modify `src/components/habits/HeatmapGrid.vue` (+ update `HeatmapGrid.test.ts`).

**Interfaces:** Consumes `buildHeatmapGrid` (Task 4) + `shadeFor` (Task 3). Props: `logs`, `color`, `days?`.

- [ ] **Step 1: Rewrite test** — `src/components/habits/HeatmapGrid.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HeatmapGrid from "./HeatmapGrid.vue";

describe("HeatmapGrid", () => {
  it("rendera 91 celdas para 91 días", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 91 } });
    expect(w.findAll("[data-testid='heat-cell']")).toHaveLength(91);
  });
  it("usa 13 columnas y 7 filas", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 91 } });
    const grid = w.find("[data-testid='heat-grid']");
    expect(grid.attributes('style')).toContain('repeat(13');
    expect(grid.attributes('style')).toContain('repeat(7');
  });
  it("celda completada usa shadeFor al 100%", () => {
    const today = new Date().toISOString().slice(0, 10);
    const w = mount(HeatmapGrid, {
      props: { logs: [{ id: "1", habit_id: "h", log_date: today, completed_at: today, note: null, created_at: today }], color: "#5e6ad2", days: 91 },
    });
    const filled = w.find("[data-testid='heat-cell'][style*='rgba(94, 106, 210, 1)']");
    expect(filled.exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement** — `src/components/habits/HeatmapGrid.vue`

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { HabitLog } from "@/schemas/habits";
import { buildHeatmapGrid } from "@/lib/buildHeatmapGrid";
import { shadeFor } from "@/lib/habitColors";

const props = withDefaults(defineProps<{ logs: HabitLog[]; color: string; days?: number }>(), { days: 91 });
const cells = computed(() => buildHeatmapGrid(props.days, props.logs));
const todayStr = new Date().toISOString().slice(0, 10);
function cellStyle(c: { completed: boolean; isEmpty: boolean; date: string }) {
  if (c.isEmpty) return "background: transparent";
  const intensity = c.completed ? 1 : 0;
  const base = shadeFor(props.color, intensity as 0 | 1);
  return c.date === todayStr && c.completed
    ? `background: ${base}; box-shadow: 0 0 0 1px ${shadeFor(props.color, 1)}`
    : `background: ${base}`;
}
</script>
<template>
  <div data-testid="heat-grid" class="grid gap-0.5"
       style="grid-template-columns: repeat(13, minmax(0,1fr)); grid-template-rows: repeat(7, minmax(0,1fr)); grid-auto-flow: column;">
    <div v-for="(c, i) in cells" :key="i" data-testid="heat-cell"
         class="w-2 h-2 rounded-sm" :style="cellStyle(c)" />
  </div>
</template>
```

- [ ] **Step 4: Run — passes.**

- [ ] **Step 5: Commit** — `feat(habits): HeatmapGrid GitHub-style orientation`

---

### Task 7: HabitCard rewrite (core)

**Files:** Modify `src/components/habits/HabitCard.vue` (+ rewrite `HabitCard.test.ts`).

**Interfaces:** Consumes `iconFor` (Task 2), `streakFor` (Task 5), `HeatmapGrid` (Task 6), `HabitContextMenu` (existing), `useUiStore` (openEdit). Props: `habit: Habit`, `logs: HabitLog[]`.

- [ ] **Step 1: Rewrite test** — `src/components/habits/HabitCard.test.ts`

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitCard from "./HabitCard.vue";
import type { Habit } from "@/schemas/habits";

const habitsMock = {
  completedToday: new Set<string>(),
  streakFor: vi.fn(() => 5),
  checkIn: vi.fn(),
  undoCheckIn: vi.fn(),
  getTodayDate: () => "2026-07-01",
};
const uiMock = { menuOpenForHabitId: null, toggleMenu: vi.fn(), openEdit: vi.fn() };
vi.mock("@/stores/habits", () => ({ useHabitsStore: () => habitsMock }));
vi.mock("@/stores/ui", () => ({ useUiStore: () => uiMock }));

const habit: Habit = {
  id: "h1", name: "Meditar", description: null, icon: "footprints",
  color: "#5e6ad2", frequency: { type: "daily", target_per_period: 1 },
  sort_order: 0, created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z", archived_at: null,
};

describe("HabitCard (glassmorphism)", () => {
  beforeEach(() => { setActivePinia(createPinia()); habitsMock.completedToday = new Set(); vi.clearAllMocks(); });

  it("usa .glass", () => {
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    expect(w.find("[data-testid='habit-card']").classes()).toContain("glass");
  });
  it("rendera el icono lineal (svg)", () => {
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    expect(w.find("[data-testid='habit-icon'] svg").exists()).toBe(true);
  });
  it("rendera título y subtítulo de racha", () => {
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    expect(w.text()).toContain("Meditar");
    expect(w.text()).toContain("Racha de 5");
  });
  it("click en título abre edición", async () => {
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    await w.find("[data-testid='habit-title']").trigger("click");
    expect(uiMock.openEdit).toHaveBeenCalledWith("h1");
  });
  it("unchecked: botón circular con border habit.color y Plus", () => {
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    const b = w.find("[data-testid='checkin-button']");
    expect(b.classes()).toContain("rounded-full");
    expect(b.attributes("style")).toContain("94, 106, 210");
    expect(b.find("svg").classes().join(" ")).toMatch(/lucide-plus/);
  });
  it("checked: botón cuadrado con bg habit.color y Check", () => {
    habitsMock.completedToday = new Set(["h1"]);
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    const b = w.find("[data-testid='checkin-button']");
    expect(b.classes()).toContain("rounded-md");
    expect(b.attributes("style")).toContain("rgba(94, 106, 210, 1)");
    expect(b.find("svg").classes().join(" ")).toMatch(/lucide-check/);
  });
  it("toggle llama checkIn/undoCheckIn", async () => {
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    await w.find("[data-testid='checkin-button']").trigger("click");
    expect(habitsMock.checkIn).toHaveBeenCalledWith("h1");
  });
  it("monta HabitContextMenu vía botón de menú", () => {
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    expect(w.find("[data-testid='menu-button']").exists()).toBe(true);
  });
  it("rendera HeatmapGrid", () => {
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    expect(w.findComponent({ name: "HeatmapGrid" }).exists()).toBe(true);
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement** — `src/components/habits/HabitCard.vue`

```vue
<script setup lang="ts">
import { computed } from "vue";
import { Check, Plus, MoreHorizontal } from "lucide-vue-next";
import type { Habit, HabitLog } from "@/schemas/habits";
import { useHabitsStore } from "@/stores/habits";
import { useUiStore } from "@/stores/ui";
import { iconFor } from "@/lib/icons";
import HabitContextMenu from "./HabitContextMenu.vue";
import HeatmapGrid from "./HeatmapGrid.vue";

const props = defineProps<{ habit: Habit; logs: HabitLog[] }>();
const habits = useHabitsStore();
const ui = useUiStore();

const checked = computed(() => habits.completedToday.has(props.habit.id));
const icon = computed(() => iconFor(props.habit.icon));
const streak = computed(() => habits.streakFor(props.habit.id));
const subtitle = computed(() => (streak.value > 0 ? `Racha de ${streak.value}` : "Sin racha"));
const isMenuOpen = computed(() => ui.menuOpenForHabitId === props.habit.id);

function toggleCheck() {
  if (checked.value) habits.undoCheckIn(props.habit.id, habits.getTodayDate());
  else habits.checkIn(props.habit.id);
}
</script>

<template>
  <div data-testid="habit-card" class="glass p-3 group relative">
    <div class="flex items-center gap-3 mb-3">
      <span data-testid="habit-icon" class="text-white shrink-0">
        <component :is="icon.icon" :size="20" :stroke-width="2" />
      </span>
      <button data-testid="habit-title" class="min-w-0 flex-1 text-left" @click="ui.openEdit(habit.id)">
        <div class="font-semibold text-ink truncate">{{ habit.name }}</div>
        <div class="text-sm text-ink-muted opacity-70">{{ subtitle }}</div>
      </button>
      <div class="flex items-center gap-1 shrink-0">
        <button data-testid="checkin-button" :class="['w-9 h-9 flex items-center justify-center transition-all active:scale-95',
          checked ? 'rounded-md' : 'rounded-full border-2']"
          :style="checked ? { backgroundColor: habit.color } : { borderColor: habit.color }"
          :aria-label="checked ? 'Desmarcar hábito' : 'Marcar hábito'" @click="toggleCheck">
          <Check v-if="checked" :size="18" :stroke-width="3" class="text-white" />
          <Plus v-else :size="18" :stroke-width="2" class="text-white" />
        </button>
        <button data-testid="menu-button" class="w-9 h-9 flex items-center justify-center opacity-0 group-hover:opacity-100"
          aria-label="Más opciones" @click="ui.toggleMenu(habit.id)">
          <MoreHorizontal :size="18" />
        </button>
      </div>
    </div>
    <HabitContextMenu v-if="isMenuOpen" :habit-id="habit.id" />
    <HeatmapGrid :logs="logs" :color="habit.color" :days="91" />
  </div>
</template>
```

- [ ] **Step 4: Run — passes.**

- [ ] **Step 5: Commit** — `feat(habits): rewrite HabitCard as glassmorphism card with line icon, streak, state button`

---

### Task 8: HabitFormModal icon picker

**Files:** Modify `src/components/habits/HabitFormModal.vue`.

**Interfaces:** Consumes `HABIT_ICONS`, `DEFAULT_HABIT_ICON` (Task 2). Sets `icon` on create/edit.

- [ ] **Step 1: Failing test** — add `src/components/habits/HabitFormModal.test.ts` (minimal)

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitFormModal from "./HabitFormModal.vue";

vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => ({ createHabit: vi.fn().mockResolvedValue(), updateHabit: vi.fn().mockResolvedValue() }),
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({ createHabitOpen: true, editingHabitId: null, closeModal: vi.fn() }),
}));

describe("HabitFormModal", () => {
  beforeEach(() => setActivePinia(createPinia()));
  it("rendera grilla de iconos seleccionable", () => {
    const w = mount(HabitFormModal);
    expect(w.findAll("[data-testid='icon-option']").length).toBeGreaterThan(0);
  });
  it("selecciona un icono al hacer click", async () => {
    const w = mount(HabitFormModal);
    const first = w.find("[data-testid='icon-option']");
    await first.trigger("click");
    expect(first.classes()).toContain("selected");
  });
});
```

- [ ] **Step 2: Run — fails.**

- [ ] **Step 3: Implement** — add an `icon` ref (default `DEFAULT_HABIT_ICON`) to the form state; render an icon grid above/beside the color swatches:

```vue
<!-- inside the form, near the color swatches -->
<div>
  <label class="text-sm text-ink-muted mb-1 block">Ícono</label>
  <div class="grid grid-cols-8 gap-1">
    <button v-for="i in HABIT_ICONS" :key="i.value" data-testid="icon-option"
      type="button" :class="['p-2 rounded-md flex items-center justify-center',
        form.icon === i.value ? 'selected bg-primary text-white' : 'bg-surface-1 text-ink']"
      @click="form.icon = i.value">
      <component :is="i.icon" :size="18" />
    </button>
  </div>
</div>
```

In `submit`: create → include `icon: form.icon`; edit → patch `icon: form.icon`. Import `HABIT_ICONS`, `DEFAULT_HABIT_ICON` from `@/lib/icons`.

- [ ] **Step 4: Run — passes.**

- [ ] **Step 5: Commit** — `feat(habits): add icon picker to HabitFormModal`

---

### Task 9: HabitRow icon alignment

**Files:** Modify `src/components/habits/HabitRow.vue`. (Light UI change — update its test if it asserts `color-dot`.)

- [ ] **Step 1:** Swap the `w-2.5 h-2.5` color dot for the white line icon using `iconFor(habit.icon)`, mirroring `HabitCard`'s icon span (`data-testid="habit-icon"`).

- [ ] **Step 2:** Update `HabitRow`'s test if it asserts `color-dot` → change selector to `habit-icon`.

- [ ] **Step 3:** `npm run test` green.

- [ ] **Step 4: Commit** — `refactor(habits): align HabitRow to line-icon style`

---

### Task 10: TodayView container

**Files:** Modify `src/views/TodayView.vue` (+ update `TodayView.test.ts`).

- [ ] **Step 1:** Drop the inner `bg-surface-2 rounded-2xl p-3` shared panel; keep `max-w-sm` column; render `HabitCard`s stacked with a `flex flex-col gap-2` so each glass card shows individually. Keep `data-testid="habits-container"` on the column.

- [ ] **Step 2:** Update `TodayView.test.ts` assertions that checked the shared panel bg → assert `gap-2` on container and that `HabitCard`/`NewHabitCard` still render.

- [ ] **Step 3:** `npm run test` green.

- [ ] **Step 4: Commit** — `refactor(today): stack glass cards in TodayView`

---

### Task 11: Final verification

- [ ] **Step 1:** `npm run test` → all green.

- [ ] **Step 2:** `npm run build` → types + build pass.

- [ ] **Step 3:** `npm run tauri dev` → manual check: cards are translucent, line icon shows, title+streak, button shape shifts on toggle, mesh renders 13 cols × 7 rows, edit (title click) + archive ( menu) work, icon picker in create/edit modal.

- [ ] **Step 4:** Save spec + plan to `docs/superpowers/specs/` and `docs/superpowers/plans/`, commit docs.

---

## Self-review

- **Spec coverage:** glass card (T7) · line icon (T2,T7,T8,T9) · title+streak subtitle (T5,T7) · state button square/circle (T7) · progress mesh GitHub 7×13 (T4,T6) · context menu mounted (T7) · clickable title (T7) · icon picker (T8) · HabitRow alignment (T9) · TodayView container (T10) · 91-day range (T5) · glassmorphism utility (T1) · Rust untouched ✓.
- **Placeholders:** none.
- **Type consistency:** `iconFor`→`HabitIcon.icon`, `streakFor(habitId):number`, `shadeFor(color,0|1)`, `GridCell{date,completed,isEmpty}` — consistent across tasks.
- **Open follow-up:** `icon` schema validation against the curated set is optional (not required by spec) — left out to avoid scope creep.
