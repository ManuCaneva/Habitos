import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import NewHabitCard from "./NewHabitCard.vue";

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    openCreate: vi.fn(),
  }),
}));

describe("NewHabitCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("tiene clase habit-card-responsive para container queries", () => {
    const wrapper = mount(NewHabitCard);
    expect(wrapper.classes()).toContain("habit-card-responsive");
  });

  it("renderiza texto 'Nuevo hábito'", () => {
    const wrapper = mount(NewHabitCard);
    expect(wrapper.text()).toContain("Nuevo hábito");
  });

  it("renderiza icono Plus", () => {
    const wrapper = mount(NewHabitCard);
    expect(wrapper.find("svg").exists()).toBe(true);
  });
});
