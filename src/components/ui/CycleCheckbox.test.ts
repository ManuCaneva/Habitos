import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import CycleCheckbox from "./CycleCheckbox.vue";

describe("CycleCheckbox", () => {
  it("should render with 'todo' state (empty box)", () => {
    const wrapper = mount(CycleCheckbox, {
      props: { modelValue: "todo" },
    });
    const box = wrapper.find("[data-testid='cycle-box']");
    expect(box.exists()).toBe(true);
    expect(box.classes()).toContain("bg-surface-1");
    expect(box.classes()).toContain("border-hairline-strong");
  });

  it("should render with 'doing' state (half-filled)", () => {
    const wrapper = mount(CycleCheckbox, {
      props: { modelValue: "doing" },
    });
    const box = wrapper.find("[data-testid='cycle-box']");
    expect(box.classes()).toContain("bg-primary/40");
    expect(box.classes()).toContain("border-primary");
  });

  it("should render with 'done' state (filled with check)", () => {
    const wrapper = mount(CycleCheckbox, {
      props: { modelValue: "done" },
    });
    const box = wrapper.find("[data-testid='cycle-box']");
    expect(box.classes()).toContain("bg-primary");
    expect(box.classes()).toContain("border-primary");
  });

  it("should cycle todo → doing on click", async () => {
    const wrapper = mount(CycleCheckbox, {
      props: { modelValue: "todo" },
    });
    await wrapper.find("input").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["doing"]);
  });

  it("should cycle doing → done on click", async () => {
    const wrapper = mount(CycleCheckbox, {
      props: { modelValue: "doing" },
    });
    await wrapper.find("input").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["done"]);
  });

  it("should cycle done → todo on click", async () => {
    const wrapper = mount(CycleCheckbox, {
      props: { modelValue: "done" },
    });
    await wrapper.find("input").trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["todo"]);
  });

  it("should not emit when disabled", async () => {
    const wrapper = mount(CycleCheckbox, {
      props: { modelValue: "todo", disabled: true },
    });
    await wrapper.find("input").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});
