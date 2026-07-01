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
