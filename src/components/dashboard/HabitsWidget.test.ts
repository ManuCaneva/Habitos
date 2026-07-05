import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitsWidget from "./HabitsWidget.vue";

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
    completedToday: new Set(),
    getTodayDate: () => "2026-01-01",
    checkIn: vi.fn(),
    undoCheckIn: vi.fn(),
    streakFor: vi.fn(() => 0),
  }),
}));

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    openCreate: vi.fn(),
    menuOpenForHabitId: null,
    toggleMenu: vi.fn(),
  }),
}));

describe("HabitsWidget", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renderiza TodayView dentro del widget", () => {
    const wrapper = mount(HabitsWidget);
    expect(wrapper.find("[data-testid='habits-panel']").exists()).toBe(true);
  });

  it("usa los estilos de superficie del design system", () => {
    const wrapper = mount(HabitsWidget);
    const el = wrapper.find("[data-testid='habits-widget']");
    expect(el.classes()).toContain("bg-surface-1");
    expect(el.classes()).toContain("rounded-xl");
    expect(el.classes()).toContain("border-hairline");
    expect(el.classes()).toContain("h-full");
  });
});
