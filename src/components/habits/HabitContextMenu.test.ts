import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitContextMenu from "./HabitContextMenu.vue";
import type { Habit } from "@/schemas/habits";

const habit: Habit = {
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

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    openEdit: vi.fn(),
    closeMenu: vi.fn(),
  }),
}));

vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => ({
    archiveHabit: vi.fn(),
    restoreHabit: vi.fn(),
  }),
}));

describe("HabitContextMenu", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.body.innerHTML = "";
  });

  it("se monta usando Teleport (sale del contenedor padre)", () => {
    const wrapper = mount(HabitContextMenu, {
      props: { habit },
      attachTo: document.body,
    });
    const menu = document.body.querySelector('[role="menu"]');
    expect(menu).toBeTruthy();
    wrapper.unmount();
  });

  it("tiene position: fixed para flotar por encima de otros elementos", () => {
    const wrapper = mount(HabitContextMenu, {
      props: { habit },
      attachTo: document.body,
    });
    const menu = document.body.querySelector('[role="menu"]') as HTMLElement;
    expect(menu).toBeTruthy();
    const style = menu.getAttribute("style") ?? "";
    expect(style).toContain("position: fixed");
    wrapper.unmount();
  });
});
