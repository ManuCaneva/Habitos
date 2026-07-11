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

  it("usa HabitCard", () => {
    const wrapper = mount(TodayView);
    expect(wrapper.findComponent({ name: "HabitCard" }).exists()).toBe(true);
  });

  it("usa EntityListing con título 'Hábitos'", () => {
    const wrapper = mount(TodayView);
    const listing = wrapper.findComponent({ name: "EntityListing" });
    expect(listing.exists()).toBe(true);
    expect(listing.props("title")).toBe("Hábitos");
  });

  it("panel no tiene max-w-2xl ni mx-auto", () => {
    const wrapper = mount(TodayView);
    const panel = wrapper.find("[data-testid='habits-panel']");
    expect(panel.classes()).not.toContain("mx-auto");
    expect(panel.classes()).not.toContain("max-w-2xl");
  });

  it("renderiza NewHabitCard", () => {
    const wrapper = mount(TodayView);
    expect(wrapper.findComponent(NewHabitCard).exists()).toBe(true);
  });

  it("usa HabitSection con variant flat", () => {
    const wrapper = mount(TodayView);
    const section = wrapper.findComponent({ name: "HabitSection" });
    expect(section.exists()).toBe(true);
    expect(section.props("variant")).toBe("flat");
  });

  it("muestra título 'Hábitos'", () => {
    const wrapper = mount(TodayView);
    expect(wrapper.text()).toContain("Hábitos");
  });

  it("no muestra contador", () => {
    const wrapper = mount(TodayView);
    expect(wrapper.text()).not.toContain("·");
  });

  it("header usa bg-surface-2 y card-title (vía EntityListing)", () => {
    const wrapper = mount(TodayView);
    const listing = wrapper.findComponent({ name: "EntityListing" });
    const header = listing.find(".bg-surface-2");
    expect(header.exists()).toBe(true);
    expect(header.classes()).toContain("border-b");
    expect(header.classes()).toContain("border-hairline");
  });

  it("scroll container tiene overflow-auto, p-1.5 y scrollbar-gutter-stable", () => {
    const wrapper = mount(TodayView);
    const listing = wrapper.findComponent({ name: "EntityListing" });
    const scroll = listing.find(".scrollbar-gutter-stable");
    expect(scroll.exists()).toBe(true);
    expect(scroll.classes()).toContain("overflow-auto");
    expect(scroll.classes()).toContain("p-1.5");
  });
});
