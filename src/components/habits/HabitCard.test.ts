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
const uiMock = { menuOpenForHabitId: null as string | null, toggleMenu: vi.fn(), openEdit: vi.fn() };
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
    expect(b.attributes("style")).toContain("#5e6ad2");
    expect(b.find("svg").classes().join(" ")).toMatch(/lucide-plus/);
  });
  it("checked: botón cuadrado con bg habit.color y Check", () => {
    habitsMock.completedToday = new Set(["h1"]);
    const w = mount(HabitCard, { props: { habit, logs: [] } });
    const b = w.find("[data-testid='checkin-button']");
    expect(b.classes()).toContain("rounded-md");
    expect(b.attributes("style")).toContain("#5e6ad2");
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
