import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import GoalCard from "./GoalCard.vue";
import type { Goal } from "@/schemas/goals";

const mockGoal: Goal = {
  id: "goal-1",
  title: "Test Goal",
  description: "Test description",
  color: "#00ff00",
  target: 10,
  unit: "pages",
  frequency: { type: "daily" },
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  archived_at: null,
};

const goalsMock = {
  logs: [],
  incrementLog: vi.fn(),
};
const uiMock = {
  menuOpenForGoalId: null as string | null,
  toggleGoalMenu: vi.fn(),
};
vi.mock("@/stores/goals", () => ({
  useGoalsStore: () => goalsMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

describe("GoalCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    goalsMock.logs = [];
    uiMock.menuOpenForGoalId = null;
    uiMock.toggleGoalMenu.mockClear();
  });

  it("should render goal title", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    expect(wrapper.text()).toContain("Test Goal");
  });

  it("should render goal description when present", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    expect(wrapper.text()).toContain("Test description");
  });

  it("should not render description when null", () => {
    const goal = { ...mockGoal, description: null };
    const wrapper = mount(GoalCard, {
      props: { goal },
    });
    expect(wrapper.find("[data-testid='goal-description']").exists()).toBe(false);
  });

  it("should render color indicator", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    const indicator = wrapper.find("[data-testid='goal-color-indicator']");
    expect(indicator.exists()).toBe(true);
    expect(indicator.attributes("style")).toContain("background-color: #00ff00");
  });

  it("should render progress text", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    expect(wrapper.text()).toContain("0/10");
  });

  it("should render unit when present", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    expect(wrapper.text()).toContain("pages");
  });

  it("should render frequency indicator", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    expect(wrapper.text()).toContain("Diario");
  });

  it("should render weekly frequency", () => {
    const goal = { ...mockGoal, frequency: { type: "weekly" as const } };
    const wrapper = mount(GoalCard, {
      props: { goal },
    });
    expect(wrapper.text()).toContain("Semanal");
  });

  it("should render interval frequency", () => {
    const goal = { ...mockGoal, frequency: { type: "interval" as const, interval_days: 3 } };
    const wrapper = mount(GoalCard, {
      props: { goal },
    });
    expect(wrapper.text()).toContain("Cada 3 días");
  });

  it("should render progress bar", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    const progressBar = wrapper.find("[data-testid='goal-progress-bar']");
    expect(progressBar.exists()).toBe(true);
  });

  it("should render increment button", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    const incrementBtn = wrapper.find("[data-testid='goal-increment-button']");
    expect(incrementBtn.exists()).toBe(true);
  });

  it("should call incrementLog when increment button clicked", async () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    const incrementBtn = wrapper.find("[data-testid='goal-increment-button']");
    await incrementBtn.trigger("click");
    expect(goalsMock.incrementLog).toHaveBeenCalledWith("goal-1", 1);
  });

  it("should render menu button", () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    const menuBtn = wrapper.find("[data-testid='goal-menu-button']");
    expect(menuBtn.exists()).toBe(true);
  });

  it("should call ui.toggleGoalMenu when menu button clicked", async () => {
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    const menuBtn = wrapper.find("[data-testid='goal-menu-button']");
    await menuBtn.trigger("click");
    expect(uiMock.toggleGoalMenu).toHaveBeenCalledWith("goal-1");
  });

  it("should render GoalContextMenu when goal menu is open for this goal", () => {
    uiMock.menuOpenForGoalId = "goal-1";
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    expect(wrapper.findComponent({ name: "GoalContextMenu" }).exists()).toBe(true);
  });

  it("should not render GoalContextMenu when goal menu is open for another goal", () => {
    uiMock.menuOpenForGoalId = "goal-2";
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    expect(wrapper.findComponent({ name: "GoalContextMenu" }).exists()).toBe(false);
  });

  it("should have z-10 class when goal menu is open", () => {
    uiMock.menuOpenForGoalId = "goal-1";
    const wrapper = mount(GoalCard, {
      props: { goal: mockGoal },
    });
    expect(wrapper.find("[data-testid='goal-card']").classes()).toContain("z-10");
  });
});
