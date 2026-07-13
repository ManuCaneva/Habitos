import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitRow from "./HabitRow.vue";
import type { Habit } from "@/schemas/habits";
import { ref } from "vue";
import { shadeFor } from "@/lib/habitColors";

const completedToday = ref<Set<string>>(new Set());
const habitsMock = {
  get completedToday() {
    return completedToday.value;
  },
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
    completedToday.value = new Set();
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

  it("botón de menú tiene el atributo data-habit-menu-trigger", () => {
    const w = mount(HabitRow, { props: { habit: base } });
    const btn = w.find("[data-testid='menu-button']");
    expect(btn.attributes("data-habit-menu-trigger")).toBe("h1");
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

  describe("feedback visual al marcar", () => {
    it("fila tiene backgroundColor tintado con el color del hábito cuando está checked", async () => {
      const w = mount(HabitRow, { props: { habit: base } });
      expect(w.find("[data-testid='habit-row']").attributes("style") ?? "").not.toContain(
        shadeFor(base.color, 0.25),
      );
      completedToday.value = new Set([base.id]);
      await w.vm.$nextTick();
      const rowStyle = w.find("[data-testid='habit-row']").attributes("style") ?? "";
      expect(rowStyle).toContain(shadeFor(base.color, 0.25));
    });

    it("botón check usa el color del hábito cuando está checked (no bg-primary)", async () => {
      const w = mount(HabitRow, { props: { habit: base } });
      const btn = w.find("[data-testid='check-button']");
      expect(btn.classes()).not.toContain("bg-primary");
      completedToday.value = new Set([base.id]);
      await w.vm.$nextTick();
      const btnStyle = w.find("[data-testid='check-button']").attributes("style") ?? "";
      expect(btnStyle).toContain(base.color);
    });
  });

  describe("reactividad a prop changes", () => {
    it("re-rendera el color del hábito cuando la prop habit.color cambia", async () => {
      const w = mount(HabitRow, { props: { habit: base } });
      expect(w.text()).toContain("Meditar");
      await w.setProps({
        habit: { ...base, color: "#eb5757", name: "Correr" },
      });
      expect(w.text()).toContain("Correr");
      const titleButton = w.find("button.flex-1");
      expect(titleButton.attributes("style") ?? "").not.toContain("#eb5757");
    });
  });
});
