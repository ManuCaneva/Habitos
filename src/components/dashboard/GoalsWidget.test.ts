import { describe, it, expect, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import GoalsWidget from "./GoalsWidget.vue";

describe("GoalsWidget", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("should render with data-testid='goals-widget'", () => {
    const wrapper = mount(GoalsWidget);
    const widget = wrapper.find("[data-testid='goals-widget']");
    expect(widget.exists()).toBe(true);
  });

  it("should use Container with variant='default' and padding='none'", () => {
    const wrapper = mount(GoalsWidget);
    const widget = wrapper.find("[data-testid='goals-widget']");
    expect(widget.classes()).toContain("bg-surface-1");
    expect(widget.classes()).toContain("border");
  });

  it("should have container-type: inline-size style", () => {
    const wrapper = mount(GoalsWidget);
    const widget = wrapper.find("[data-testid='goals-widget']");
    expect(widget.attributes("style")).toContain("container-type: inline-size");
  });

  it("should render GoalsListView", () => {
    const wrapper = mount(GoalsWidget);
    const listView = wrapper.findComponent({ name: "GoalsListView" });
    expect(listView.exists()).toBe(true);
  });
});
