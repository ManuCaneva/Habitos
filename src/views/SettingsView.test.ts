import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import SettingsView from "./SettingsView.vue";

vi.mock("@/composables/useTheme", () => ({
  useTheme: () => ({
    isDark: true,
    setTheme: vi.fn(),
  }),
}));

describe("SettingsView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("main element has h-full and overflow-y-auto", () => {
    const wrapper = mount(SettingsView);
    const main = wrapper.find("main");
    expect(main.exists()).toBe(true);
    expect(main.classes()).toContain("h-full");
    expect(main.classes()).toContain("overflow-y-auto");
  });
});
