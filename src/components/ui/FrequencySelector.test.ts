import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import FrequencySelector from "./FrequencySelector.vue";

describe("FrequencySelector", () => {
  it("should render three frequency options", () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "daily" } },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons).toHaveLength(3);
    expect(buttons[0].text()).toBe("Diario");
    expect(buttons[1].text()).toBe("Semanal");
    expect(buttons[2].text()).toBe("Intervalo");
  });

  it("should highlight active frequency", () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "weekly" } },
    });
    const buttons = wrapper.findAll("button");
    expect(buttons[1].classes()).toContain("bg-primary");
    expect(buttons[1].classes()).toContain("text-white");
  });

  it("should emit daily on click", async () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "weekly" } },
    });
    await wrapper.findAll("button")[0].trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([{ type: "daily" }]);
  });

  it("should emit weekly on click", async () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "daily" } },
    });
    await wrapper.findAll("button")[1].trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([{ type: "weekly" }]);
  });

  it("should emit interval with default 3 days on click", async () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "daily" } },
    });
    await wrapper.findAll("button")[2].trigger("click");
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([{ type: "interval", interval_days: 3 }]);
  });

  it("should show interval_days input when interval is selected", () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "interval", interval_days: 5 } },
    });
    const input = wrapper.find("input[type='number']");
    expect(input.exists()).toBe(true);
    expect((input.element as HTMLInputElement).value).toBe("5");
  });

  it("should emit updated interval_days on input change", async () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "interval", interval_days: 3 } },
    });
    const input = wrapper.find("input[type='number']");
    await input.setValue(7);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([{ type: "interval", interval_days: 7 }]);
  });

  it("should clamp interval_days to min 1", async () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "interval", interval_days: 3 } },
    });
    const input = wrapper.find("input[type='number']");
    await input.setValue(0);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([{ type: "interval", interval_days: 1 }]);
  });

  it("should clamp interval_days to max 365", async () => {
    const wrapper = mount(FrequencySelector, {
      props: { modelValue: { type: "interval", interval_days: 3 } },
    });
    const input = wrapper.find("input[type='number']");
    await input.setValue(400);
    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual([{ type: "interval", interval_days: 365 }]);
  });
});
