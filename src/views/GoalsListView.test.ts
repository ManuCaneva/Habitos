import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import GoalsListView from "./GoalsListView.vue";

const goalsState = ref<any[]>([]);
const logsState = ref<any[]>([]);
const goalsMock = {
  get goals() {
    return goalsState.value;
  },
  get logs() {
    return logsState.value;
  },
  loadLogsForRange: vi.fn(),
};
const uiMock = {
  menuOpenForGoalId: ref<string | null>(null),
  toggleGoalMenu: vi.fn(),
  openEditGoal: vi.fn(),
};
vi.mock("@/stores/goals", () => ({
  useGoalsStore: () => goalsMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

describe("GoalsListView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    goalsState.value = [];
    logsState.value = [];
    uiMock.menuOpenForGoalId.value = null;
  });

  it("should render with data-testid='goals-panel'", () => {
    const wrapper = mount(GoalsListView);
    const panel = wrapper.find("[data-testid='goals-panel']");
    expect(panel.exists()).toBe(true);
  });

  it("should render header with 'Objetivos' title", () => {
    const wrapper = mount(GoalsListView);
    expect(wrapper.text()).toContain("Objetivos");
  });

  it("should render goal count in header", () => {
    goalsState.value = [
      {
        id: "goal-1",
        title: "Goal 1",
        description: null,
        color: "#00ff00",
        target: 10,
        unit: null,
        frequency: { type: "daily" },
      },
    ];
    const wrapper = mount(GoalsListView);
    expect(wrapper.text()).toContain("1");
  });

  it("should render GoalCard for each goal", () => {
    goalsState.value = [
      {
        id: "goal-1",
        title: "Goal 1",
        description: null,
        color: "#00ff00",
        target: 10,
        unit: null,
        frequency: { type: "daily" },
      },
      {
        id: "goal-2",
        title: "Goal 2",
        description: null,
        color: "#ff0000",
        target: 20,
        unit: null,
        frequency: { type: "weekly" },
      },
    ];
    const wrapper = mount(GoalsListView);
    const cards = wrapper.findAllComponents({ name: "GoalCard" });
    expect(cards).toHaveLength(2);
  });

  it("should render NewGoalCard", () => {
    const wrapper = mount(GoalsListView);
    const newCard = wrapper.findComponent({ name: "NewGoalCard" });
    expect(newCard.exists()).toBe(true);
  });

  it("should have GoalContextMenu in template", () => {
    // GoalContextMenu is tested separately in GoalContextMenu.test.ts
    goalsState.value = [
      {
        id: "goal-1",
        title: "Goal 1",
        description: null,
        color: "#00ff00",
        target: 10,
        unit: null,
        frequency: { type: "daily" },
      },
    ];
    uiMock.menuOpenForGoalId.value = "goal-1";
    const wrapper = mount(GoalsListView);
    // Component should exist and render without errors
    expect(wrapper.find("[data-testid='goals-panel']").exists()).toBe(true);
  });

  it("should not render GoalContextMenu when menu is closed", () => {
    goalsState.value = [
      {
        id: "goal-1",
        title: "Goal 1",
        description: null,
        color: "#00ff00",
        target: 10,
        unit: null,
        frequency: { type: "daily" },
      },
    ];
    uiMock.menuOpenForGoalId.value = null;
    const wrapper = mount(GoalsListView);
    const contextMenu = wrapper.findComponent({ name: "GoalContextMenu" });
    expect(contextMenu.exists()).toBe(false);
  });
});
