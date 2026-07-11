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
      containerHeight: 600,
    }),
    gridToPixel: vi.fn(),
    snapToGrid: vi.fn(),
  }),
  applyGapToPixel: vi.fn((xPercent, yPercent, wPercent, hPercent, containerWidth, containerHeight, _gap) => ({
    left: xPercent * containerWidth,
    top: yPercent * containerHeight,
    width: wPercent * containerWidth,
    height: hPercent * containerHeight,
  })),
}));

vi.mock("@/composables/useDashDrag", () => ({
  useDashDrag: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  listHabits: vi.fn().mockResolvedValue([]),
  listLogsInRange: vi.fn().mockResolvedValue([]),
  loadConfig: vi.fn().mockResolvedValue(null),
  saveConfig: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => ({
    activeHabits: [],
    logs: [],
    completedToday: new Set(),
    loadInitialData: vi.fn(),
  }),
}));

let editModeValue = false;
const mockRemoveWidget = vi.fn();

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    get editMode() {
      return editModeValue;
    },
    openCreate: vi.fn(),
    menuOpenForHabitId: null,
    toggleMenu: vi.fn(),
  }),
}));

vi.mock("@/stores/dashboard", () => ({
  useDashboardStore: () => ({
    get layout() {
      return [
        { i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
      ];
    },
    removeWidget: mockRemoveWidget,
  }),
}));

describe("DashboardView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    editModeValue = false;
    mockRemoveWidget.mockClear();
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

  it("root element has h-full and overflow-hidden", () => {
    const wrapper = mount(DashboardView);
    const root = wrapper.find("[data-testid='dashboard-view']");
    expect(root.classes()).toContain("h-full");
    expect(root.classes()).toContain("overflow-hidden");
  });

  it("grid container has h-full instead of min-height: 100%", () => {
    const wrapper = mount(DashboardView);
    const root = wrapper.find("[data-testid='dashboard-view']");
    const gridContainer = root.find("div");
    expect(gridContainer.classes()).toContain("h-full");
    const style = gridContainer.attributes("style") ?? "";
    expect(style).not.toContain("min-height");
  });

  it("no renderiza WidgetPicker si editMode es false", () => {
    editModeValue = false;
    const wrapper = mount(DashboardView);
    expect(wrapper.find("[data-testid='widget-picker']").exists()).toBe(false);
  });

  it("renderiza WidgetPicker si editMode es true", () => {
    editModeValue = true;
    const wrapper = mount(DashboardView);
    expect(wrapper.find("[data-testid='widget-picker']").exists()).toBe(true);
  });

  it("renderiza WidgetRemoveButton en cada widget si editMode es true", () => {
    editModeValue = true;
    const wrapper = mount(DashboardView);
    const removeButtons = wrapper.findAllComponents({ name: "WidgetRemoveButton" });
    expect(removeButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("no renderiza WidgetRemoveButton si editMode es false", () => {
    editModeValue = false;
    const wrapper = mount(DashboardView);
    const removeButtons = wrapper.findAllComponents({ name: "WidgetRemoveButton" });
    expect(removeButtons.length).toBe(0);
  });

  it("al remover un widget, llama removeWidget del store", async () => {
    editModeValue = true;
    const wrapper = mount(DashboardView);
    const removeBtn = wrapper.findComponent({ name: "WidgetRemoveButton" });
    removeBtn.vm.$emit("remove", "habits");
    await wrapper.vm.$nextTick();
    expect(mockRemoveWidget).toHaveBeenCalledWith("habits");
  });
});
