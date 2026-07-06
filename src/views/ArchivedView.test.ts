import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import ArchivedView from "./ArchivedView.vue";

vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => ({
    archivedHabits: [],
  }),
}));

describe("ArchivedView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("main element has h-full and overflow-y-auto", () => {
    const wrapper = mount(ArchivedView);
    const main = wrapper.find("main");
    expect(main.exists()).toBe(true);
    expect(main.classes()).toContain("h-full");
    expect(main.classes()).toContain("overflow-y-auto");
  });
});
