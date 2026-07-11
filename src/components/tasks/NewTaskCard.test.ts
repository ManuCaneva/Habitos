import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import NewTaskCard from "./NewTaskCard.vue";

const uiMock = {
  openCreateTask: vi.fn(),
};
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

describe("NewTaskCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should render with role='button'", () => {
    const wrapper = mount(NewTaskCard);
    const card = wrapper.find("[data-testid='new-task-card']");
    expect(card.attributes("role")).toBe("button");
  });

  it("should have tabindex for keyboard navigation", () => {
    const wrapper = mount(NewTaskCard);
    const card = wrapper.find("[data-testid='new-task-card']");
    expect(card.attributes("tabindex")).toBe("0");
  });

  it("should have aria-label", () => {
    const wrapper = mount(NewTaskCard);
    const card = wrapper.find("[data-testid='new-task-card']");
    expect(card.attributes("aria-label")).toBe("Crear nueva tarea");
  });

  it("should call openCreateTask on click", async () => {
    const wrapper = mount(NewTaskCard);
    const card = wrapper.find("[data-testid='new-task-card']");
    await card.trigger("click");
    expect(uiMock.openCreateTask).toHaveBeenCalled();
  });

  it("should call openCreateTask on Enter key", async () => {
    const wrapper = mount(NewTaskCard);
    const card = wrapper.find("[data-testid='new-task-card']");
    await card.trigger("keydown", { key: "Enter" });
    expect(uiMock.openCreateTask).toHaveBeenCalled();
  });

  it("should call openCreateTask on Space key", async () => {
    const wrapper = mount(NewTaskCard);
    const card = wrapper.find("[data-testid='new-task-card']");
    await card.trigger("keydown", { key: " " });
    expect(uiMock.openCreateTask).toHaveBeenCalled();
  });

  it("should have responsive class", () => {
    const wrapper = mount(NewTaskCard);
    const card = wrapper.find("[data-testid='new-task-card']");
    expect(card.classes()).toContain("task-card-responsive");
  });
});
