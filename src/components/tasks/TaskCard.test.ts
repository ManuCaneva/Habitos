import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TaskCard from "./TaskCard.vue";
import type { Task } from "@/schemas/tasks";

const mockTask: Task = {
  id: "task-1",
  title: "Test Task",
  description: "Test description",
  color: "#ff0000",
  status: "todo",
  due_date: null,
  steps: [
    { id: "step-1", title: "Step 1", done: false },
    { id: "step-2", title: "Step 2", done: true },
  ],
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("TaskCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render task title", () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    expect(wrapper.text()).toContain("Test Task");
  });

  it("should render task description when present", () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    expect(wrapper.text()).toContain("Test description");
  });

  it("should not render description when null", () => {
    const task = { ...mockTask, description: null };
    const wrapper = mount(TaskCard, {
      props: { task },
    });
    expect(wrapper.find("[data-testid='task-description']").exists()).toBe(false);
  });

  it("should render color indicator", () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    const indicator = wrapper.find("[data-testid='task-color-indicator']");
    expect(indicator.exists()).toBe(true);
    expect(indicator.attributes("style")).toContain("background-color: #ff0000");
  });

  it("should render CycleCheckbox with correct status", () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    const checkbox = wrapper.findComponent({ name: "CycleCheckbox" });
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.props("modelValue")).toBe("todo");
  });

  it("should emit update:status when CycleCheckbox changes", async () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    const checkbox = wrapper.findComponent({ name: "CycleCheckbox" });
    await checkbox.vm.$emit("update:modelValue", "doing");
    expect(wrapper.emitted("update:status")).toBeTruthy();
    expect(wrapper.emitted("update:status")![0]).toEqual(["doing"]);
  });

  it("should render steps count", () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    expect(wrapper.text()).toContain("1/2");
  });

  it("should not render steps count when no steps", () => {
    const task = { ...mockTask, steps: [] };
    const wrapper = mount(TaskCard, {
      props: { task },
    });
    expect(wrapper.find("[data-testid='task-steps']").exists()).toBe(false);
  });

  it("should render deadline urgency when due_date exists", () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const task = { ...mockTask, due_date: tomorrow.toISOString().split("T")[0] };
    const wrapper = mount(TaskCard, {
      props: { task },
    });
    expect(wrapper.find("[data-testid='task-deadline']").exists()).toBe(true);
  });

  it("should not render deadline when due_date is null", () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    expect(wrapper.find("[data-testid='task-deadline']").exists()).toBe(false);
  });

  it("should render progress bar when due_date exists", () => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const task = { ...mockTask, due_date: tomorrow.toISOString().split("T")[0] };
    const wrapper = mount(TaskCard, {
      props: { task },
    });
    expect(wrapper.find("[data-testid='task-progress-bar']").exists()).toBe(true);
  });

  it("should render menu button", () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    const menuBtn = wrapper.find("[data-testid='task-menu-button']");
    expect(menuBtn.exists()).toBe(true);
  });

  it("should emit toggle:menu when menu button clicked", async () => {
    const wrapper = mount(TaskCard, {
      props: { task: mockTask },
    });
    const menuBtn = wrapper.find("[data-testid='task-menu-button']");
    await menuBtn.trigger("click");
    expect(wrapper.emitted("toggle:menu")).toBeTruthy();
  });
});
