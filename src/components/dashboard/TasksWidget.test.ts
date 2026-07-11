import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TasksWidget from "./TasksWidget.vue";

describe("TasksWidget", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render with data-testid='tasks-widget'", () => {
    const wrapper = mount(TasksWidget);
    const widget = wrapper.find("[data-testid='tasks-widget']");
    expect(widget.exists()).toBe(true);
  });

  it("should use Container with variant='default' and padding='none'", () => {
    const wrapper = mount(TasksWidget);
    const widget = wrapper.find("[data-testid='tasks-widget']");
    expect(widget.classes()).toContain("bg-surface-1");
    expect(widget.classes()).toContain("border");
  });

  it("should have container-type: inline-size style", () => {
    const wrapper = mount(TasksWidget);
    const widget = wrapper.find("[data-testid='tasks-widget']");
    expect(widget.attributes("style")).toContain("container-type: inline-size");
  });

  it("should render TasksListView", () => {
    const wrapper = mount(TasksWidget);
    const listView = wrapper.findComponent({ name: "TasksListView" });
    expect(listView.exists()).toBe(true);
  });
});
