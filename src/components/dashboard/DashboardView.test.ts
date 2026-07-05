import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import DashboardView from "./DashboardView.vue";

vi.mock("@/composables/useDashGrid", () => ({
  useDashGrid: () => ({
    dims: ref({
      colWidth: 100,
      rowHeight: 80,
      marginX: 12,
      marginY: 12,
      containerWidth: 1200,
    }),
    gridToPixel: vi.fn(),
    snapToGrid: vi.fn(),
  }),
}));

vi.mock("@/composables/useDashDrag", () => ({
  useDashDrag: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  listHabits: vi.fn().mockResolvedValue([]),
  listLogsInRange: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => ({
    activeHabits: [],
    logs: [],
    completedToday: new Set(),
    loadInitialData: vi.fn(),
  }),
}));

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    editMode: false,
    openCreate: vi.fn(),
    menuOpenForHabitId: null,
    toggleMenu: vi.fn(),
  }),
}));

describe("DashboardView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renderiza el contenedor del dashboard", () => {
    const wrapper = mount(DashboardView);
    expect(wrapper.find("[data-testid='dashboard-view']").exists()).toBe(true);
  });

  it("renderiza GridItemVue para cada item del layout", () => {
    const wrapper = mount(DashboardView);
    const items = wrapper.findAllComponents({ name: "GridItemVue" });
    expect(items.length).toBeGreaterThanOrEqual(1);
  });

  it("pasa dims al GridItemVue", () => {
    const wrapper = mount(DashboardView);
    const items = wrapper.findAllComponents({ name: "GridItemVue" });
    expect(items.length).toBeGreaterThan(0);
    const firstItem = items[0];
    expect(firstItem.props("dims")).toBeDefined();
    expect(firstItem.props("dims").colWidth).toBe(100);
  });
});
