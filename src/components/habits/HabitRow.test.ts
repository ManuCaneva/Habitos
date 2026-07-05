import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitRow from "./HabitRow.vue";
import type { Habit } from "@/schemas/habits";

const habitsMock = {
  completedToday: new Set<string>(),
  checkIn: vi.fn(),
  undoCheckIn: vi.fn(),
  getTodayDate: () => "2026-07-01",
  currentStreak: () => 0,
};
const uiMock = { menuOpenForHabitId: null as string | null, toggleMenu: vi.fn(), openEdit: vi.fn() };
vi.mock("@/stores/habits", () => ({ useHabitsStore: () => habitsMock }));
vi.mock("@/stores/ui", () => ({ useUiStore: () => uiMock }));

const base: Habit = {
  id: "h1",
  name: "Meditar",
  description: null,
  icon: "footprints",
  color: "#5e6ad2",
  frequency: { type: "daily", target_per_period: 1 },
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  archived_at: null,
};

describe("HabitRow", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    habitsMock.completedToday = new Set();
    vi.clearAllMocks();
  });

  it("rendera el nombre del hábito", () => {
    const w = mount(HabitRow, { props: { habit: base } });
    expect(w.text()).toContain("Meditar");
  });

  it("botón de menú siempre visible (sin opacity-0)", () => {
    const w = mount(HabitRow, { props: { habit: base } });
    expect(w.find("[data-testid='menu-button']").exists()).toBe(true);
    expect(w.find("[data-testid='menu-button']").classes()).not.toContain("opacity-0");
  });

  it("botón menú aparece antes que botón check", () => {
    const w = mount(HabitRow, { props: { habit: base } });
    const all = w.findAll("[data-testid='check-button'], [data-testid='menu-button']");
    const checkIndex = all.findIndex((el: ReturnType<typeof w.find>) => el.attributes("data-testid") === "check-button");
    const menuIndex = all.findIndex((el: ReturnType<typeof w.find>) => el.attributes("data-testid") === "menu-button");
    expect(menuIndex).toBeGreaterThanOrEqual(0);
    expect(checkIndex).toBeGreaterThanOrEqual(0);
    expect(menuIndex).toBeLessThan(checkIndex);
  });

  it("row tiene z-10 cuando su menú está abierto", () => {
    uiMock.menuOpenForHabitId = "h1";
    const w = mount(HabitRow, { props: { habit: base } });
    expect(w.find("[data-testid='habit-row']").classes()).toContain("z-10");
  });

  it("row NO tiene z-10 cuando otro menú está abierto", () => {
    uiMock.menuOpenForHabitId = "h2";
    const w = mount(HabitRow, { props: { habit: base } });
    expect(w.find("[data-testid='habit-row']").classes()).not.toContain("z-10");
  });
});
