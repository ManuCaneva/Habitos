import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import App from "./App.vue";

vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => ({
    loadInitialData: vi.fn(),
    activeHabits: [],
    logs: [],
    completedToday: new Set(),
  }),
}));

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    viewMode: "dashboard",
    editMode: false,
    sidebarCollapsed: false,
  }),
}));

vi.mock("@/components/dashboard/DashboardView.vue", () => ({
  default: { template: '<div data-testid="mock-dashboard" />' },
}));

vi.mock("@/views/ArchivedView.vue", () => ({
  default: { template: '<div data-testid="mock-archived" />' },
}));

vi.mock("@/views/SettingsView.vue", () => ({
  default: { template: '<div data-testid="mock-settings" />' },
}));

vi.mock("@/components/layout/Sidebar.vue", () => ({
  default: { template: '<aside data-testid="mock-sidebar" />' },
}));

vi.mock("@/components/habits/HabitFormModal.vue", () => ({
  default: { template: '<div data-testid="mock-modal" />' },
}));

describe("App layout", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("root element has h-screen and overflow-hidden", () => {
    const wrapper = mount(App);
    const root = wrapper.element as HTMLElement;
    expect(root.classList.contains("h-screen")).toBe(true);
    expect(root.classList.contains("overflow-hidden")).toBe(true);
    expect(root.classList.contains("min-h-screen")).toBe(false);
  });

  it("main content area has h-full and overflow-hidden", () => {
    const wrapper = mount(App);
    const root = wrapper.element as HTMLElement;
    const contentWrapper = root.querySelector(".flex-1.flex.flex-col.min-w-0") as HTMLElement;
    expect(contentWrapper).toBeTruthy();
    expect(contentWrapper.classList.contains("h-full")).toBe(true);
    expect(contentWrapper.classList.contains("overflow-hidden")).toBe(true);
  });

  it("view container has min-h-0 and overflow-hidden", () => {
    const wrapper = mount(App);
    const root = wrapper.element as HTMLElement;
    const viewContainer = root.querySelector(".flex-1.px-3.py-4") as HTMLElement;
    expect(viewContainer).toBeTruthy();
    expect(viewContainer.classList.contains("min-h-0")).toBe(true);
    expect(viewContainer.classList.contains("overflow-hidden")).toBe(true);
  });
});
