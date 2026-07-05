import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TodayView from "./TodayView.vue";
import NewHabitCard from "@/components/habits/NewHabitCard.vue";

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

describe("TodayView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("usa HabitCard en vez de HabitList", () => {
    const wrapper = mount(TodayView);
    const habitCard = wrapper.findComponent({ name: "HabitCard" });
    expect(habitCard.exists()).toBe(true);
  });

  it("panel no tiene max-w-2xl ni mx-auto", () => {
    const wrapper = mount(TodayView);
    const panel = wrapper.find("[data-testid='habits-panel']");
    expect(panel.classes()).not.toContain("mx-auto");
    expect(panel.classes()).not.toContain("max-w-2xl");
  });

  it("panel usa w-[15%] y self-start (alineado a la izquierda)", () => {
    const wrapper = mount(TodayView);
    const panel = wrapper.find("[data-testid='habits-panel']");
    expect(panel.classes()).toContain("w-[15%]");
    expect(panel.classes()).toContain("self-start");
  });

  it("no tiene header con título 'Hábitos'", () => {
    const wrapper = mount(TodayView);
    expect(wrapper.text()).not.toContain("Hábitos");
  });

  it("renderiza NewHabitCard al final de la lista", () => {
    const wrapper = mount(TodayView);
    const newCard = wrapper.findComponent(NewHabitCard);
    expect(newCard.exists()).toBe(true);
  });

  it("usa HabitSection como contenedor visual", () => {
    const wrapper = mount(TodayView);
    const section = wrapper.findComponent({ name: "HabitSection" });
    expect(section.exists()).toBe(true);
  });
});
