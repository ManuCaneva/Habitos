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

  it("texto 'Nuevo hábito' tiene clase new-habit-card-text", () => {
    const wrapper = mount(NewHabitCard);
    const text = wrapper.find(".new-habit-card-text");
    expect(text.exists()).toBe(true);
    expect(text.text()).toContain("Nuevo hábito");
  });

  it("icono Plus tiene clase new-habit-card-icon", () => {
    const wrapper = mount(NewHabitCard);
    const icon = wrapper.find(".new-habit-card-icon");
    expect(icon.exists()).toBe(true);
  });
});
