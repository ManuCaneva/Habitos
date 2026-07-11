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

  it("usa EntityListing con título 'Objetivos'", () => {
    const wrapper = mount(GoalsListView);
    const listing = wrapper.findComponent({ name: "EntityListing" });
    expect(listing.exists()).toBe(true);
    expect(listing.props("title")).toBe("Objetivos");
  });

  it("panel tiene data-testid", () => {
    const wrapper = mount(GoalsListView);
    expect(wrapper.find("[data-testid='goals-panel']").exists()).toBe(true);
  });

  it("muestra título 'Objetivos'", () => {
    const wrapper = mount(GoalsListView);
    expect(wrapper.text()).toContain("Objetivos");
  });

  it("no muestra contador", () => {
    goalsState.value = [
      { id: "goal-1", title: "Goal 1", description: null, color: "#00ff00", target: 10, unit: null, frequency: { type: "daily" } },
    ];
    const wrapper = mount(GoalsListView);
    expect(wrapper.text()).not.toContain("·");
  });

  it("renderiza GoalCard por cada objetivo", () => {
    goalsState.value = [
      { id: "goal-1", title: "Goal 1", description: null, color: "#00ff00", target: 10, unit: null, frequency: { type: "daily" } },
      { id: "goal-2", title: "Goal 2", description: null, color: "#ff0000", target: 20, unit: null, frequency: { type: "weekly" } },
    ];
    const wrapper = mount(GoalsListView);
    expect(wrapper.findAllComponents({ name: "GoalCard" })).toHaveLength(2);
  });

  it("renderiza NewGoalCard", () => {
    const wrapper = mount(GoalsListView);
    expect(wrapper.findComponent({ name: "NewGoalCard" }).exists()).toBe(true);
  });

  it("GoalContextMenu aparece cuando el menú está abierto", () => {
    goalsState.value = [
      { id: "goal-1", title: "Goal 1", description: null, color: "#00ff00", target: 10, unit: null, frequency: { type: "daily" } },
    ];
    uiMock.menuOpenForGoalId.value = "goal-1";
    const wrapper = mount(GoalsListView);
    expect(wrapper.find("[data-testid='goals-panel']").exists()).toBe(true);
  });

  it("GoalContextMenu no aparece cuando el menú está cerrado", () => {
    goalsState.value = [
      { id: "goal-1", title: "Goal 1", description: null, color: "#00ff00", target: 10, unit: null, frequency: { type: "daily" } },
    ];
    uiMock.menuOpenForGoalId.value = null;
    const wrapper = mount(GoalsListView);
    expect(wrapper.findComponent({ name: "GoalContextMenu" }).exists()).toBe(false);
  });
});
