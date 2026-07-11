import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitContextMenu from "./HabitContextMenu.vue";

const habitsMock = {
  archiveHabit: vi.fn().mockResolvedValue(undefined),
  restoreHabit: vi.fn().mockResolvedValue(undefined),
};
const uiMock = {
  openEdit: vi.fn(),
  closeMenu: vi.fn(),
};
vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => habitsMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

const mockHabit = {
  id: "habit-1",
  name: "Test Habit",
  description: null,
  color: "#ff0000",
  icon: "dumbbell",
  frequency: { type: "daily" as const, target_per_period: 1 },
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  archived_at: null,
};

describe("HabitContextMenu", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    habitsMock.archiveHabit.mockClear();
    habitsMock.restoreHabit.mockClear();
    uiMock.openEdit.mockClear();
    uiMock.closeMenu.mockClear();
  });

  it("renders via EntityContextMenu", () => {
    const wrapper = mount(HabitContextMenu, {
      props: { habit: mockHabit },
    });
    expect(wrapper.findComponent({ name: "EntityContextMenu" }).exists()).toBe(true);
  });

  it("passes correct props to EntityContextMenu", () => {
    const wrapper = mount(HabitContextMenu, {
      props: { habit: mockHabit },
    });
    const ctx = wrapper.findComponent({ name: "EntityContextMenu" });
    expect(ctx.props("entityId")).toBe("habit-1");
    expect(ctx.props("isArchived")).toBe(false);
    expect(ctx.props("triggerDataAttr")).toBe("data-habit-menu-trigger");
  });

  it("passes isArchived=true when habit is archived", () => {
    const wrapper = mount(HabitContextMenu, {
      props: { habit: { ...mockHabit, archived_at: "2026-01-01T00:00:00Z" } },
    });
    const ctx = wrapper.findComponent({ name: "EntityContextMenu" });
    expect(ctx.props("isArchived")).toBe(true);
  });
});
