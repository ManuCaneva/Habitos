import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import NewGoalCard from "./NewGoalCard.vue";

const uiMock = {
  openCreateGoal: vi.fn(),
};
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

describe("NewGoalCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should render with role='button'", () => {
    const wrapper = mount(NewGoalCard);
    const card = wrapper.find("[data-testid='new-goal-card']");
    expect(card.attributes("role")).toBe("button");
  });

  it("should have tabindex for keyboard navigation", () => {
    const wrapper = mount(NewGoalCard);
    const card = wrapper.find("[data-testid='new-goal-card']");
    expect(card.attributes("tabindex")).toBe("0");
  });

  it("should have aria-label", () => {
    const wrapper = mount(NewGoalCard);
    const card = wrapper.find("[data-testid='new-goal-card']");
    expect(card.attributes("aria-label")).toBe("Crear nuevo objetivo");
  });

  it("should call openCreateGoal on click", async () => {
    const wrapper = mount(NewGoalCard);
    const card = wrapper.find("[data-testid='new-goal-card']");
    await card.trigger("click");
    expect(uiMock.openCreateGoal).toHaveBeenCalled();
  });

  it("should call openCreateGoal on Enter key", async () => {
    const wrapper = mount(NewGoalCard);
    const card = wrapper.find("[data-testid='new-goal-card']");
    await card.trigger("keydown", { key: "Enter" });
    expect(uiMock.openCreateGoal).toHaveBeenCalled();
  });

  it("should call openCreateGoal on Space key", async () => {
    const wrapper = mount(NewGoalCard);
    const card = wrapper.find("[data-testid='new-goal-card']");
    await card.trigger("keydown", { key: " " });
    expect(uiMock.openCreateGoal).toHaveBeenCalled();
  });

  it("should have responsive class", () => {
    const wrapper = mount(NewGoalCard);
    const card = wrapper.find("[data-testid='new-goal-card']");
    expect(card.classes()).toContain("goal-card-responsive");
  });
});
