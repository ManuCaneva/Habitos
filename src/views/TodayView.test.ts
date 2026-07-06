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

  it("panel no tiene w-[15%] ni self-start (ocupa todo el ancho del widget)", () => {
    const wrapper = mount(TodayView);
    const panel = wrapper.find("[data-testid='habits-panel']");
    expect(panel.classes()).not.toContain("w-[15%]");
    expect(panel.classes()).not.toContain("self-start");
  });

  it("muestra título 'Hábitos' con cantidad activa", () => {
    const wrapper = mount(TodayView);
    expect(wrapper.text()).toContain("Hábitos");
    expect(wrapper.text()).toContain("1");
  });

  it("renderiza NewHabitCard al final de la lista", () => {
    const wrapper = mount(TodayView);
    const newCard = wrapper.findComponent(NewHabitCard);
    expect(newCard.exists()).toBe(true);
  });

  it("usa HabitSection con variant flat (sin borde duplicado)", () => {
    const wrapper = mount(TodayView);
    const section = wrapper.findComponent({ name: "HabitSection" });
    expect(section.exists()).toBe(true);
    expect(section.props("variant")).toBe("flat");
  });

  it("header NO usa sticky (está fuera del scroll)", () => {
    const wrapper = mount(TodayView);
    const header = wrapper.find("[data-testid='habits-header']");
    expect(header.exists()).toBe(true);
    expect(header.classes()).not.toContain("sticky");
  });

  it("header está antes del contenedor scrolleable de cards", () => {
    const wrapper = mount(TodayView);
    const header = wrapper.find("[data-testid='habits-header']");
    const scrollContainer = wrapper.find("[data-testid='habits-scroll']");
    expect(header.exists()).toBe(true);
    expect(scrollContainer.exists()).toBe(true);
    const headerIndex = wrapper.element.innerHTML.indexOf('data-testid="habits-header"');
    const scrollIndex = wrapper.element.innerHTML.indexOf('data-testid="habits-scroll"');
    expect(headerIndex).toBeLessThan(scrollIndex);
  });

  it("contenedor de cards tiene overflow-auto", () => {
    const wrapper = mount(TodayView);
    const scrollContainer = wrapper.find("[data-testid='habits-scroll']");
    expect(scrollContainer.exists()).toBe(true);
    expect(scrollContainer.classes()).toContain("overflow-auto");
  });

  it("contenedor scrolleable tiene padding reducido (p-1.5 = 50% de p-3)", () => {
    const wrapper = mount(TodayView);
    const scrollContainer = wrapper.find("[data-testid='habits-scroll']");
    expect(scrollContainer.classes()).toContain("p-1.5");
    expect(scrollContainer.classes()).not.toContain("p-3");
  });

  it("header tiene clase habits-header-responsive para container queries", () => {
    const wrapper = mount(TodayView);
    const header = wrapper.find("[data-testid='habits-header']");
    expect(header.classes()).toContain("habits-header-responsive");
  });

  it("título 'Hábitos' tiene clase habits-header-title", () => {
    const wrapper = mount(TodayView);
    const title = wrapper.find(".habits-header-title");
    expect(title.exists()).toBe(true);
    expect(title.text()).toBe("Hábitos");
  });

  it("contador tiene clase habits-header-count", () => {
    const wrapper = mount(TodayView);
    const count = wrapper.find(".habits-header-count");
    expect(count.exists()).toBe(true);
    expect(count.text()).toContain("1");
  });
});
