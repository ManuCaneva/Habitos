import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import WidgetRemoveButton from "./WidgetRemoveButton.vue";

describe("WidgetRemoveButton", () => {
  it("renderiza un botón con aria-label", () => {
    const wrapper = mount(WidgetRemoveButton, {
      props: { widgetId: "habits" },
    });
    const btn = wrapper.find("button");
    expect(btn.exists()).toBe(true);
    expect(btn.attributes("aria-label")).toBeTruthy();
  });

  it("emite remove con el widgetId al hacer click", async () => {
    const wrapper = mount(WidgetRemoveButton, {
      props: { widgetId: "tasks" },
    });
    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("remove")).toHaveLength(1);
    expect(wrapper.emitted("remove")![0]).toEqual(["tasks"]);
  });
});
