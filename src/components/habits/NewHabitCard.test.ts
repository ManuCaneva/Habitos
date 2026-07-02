import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import NewHabitCard from "./NewHabitCard.vue";
import { useUiStore } from "@/stores/ui";

describe("NewHabitCard", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renderiza texto 'Nuevo hábito'", () => {
    const wrapper = mount(NewHabitCard);
    expect(wrapper.text()).toContain("Nuevo hábito");
  });

  it("renderiza un ícono Plus", () => {
    const wrapper = mount(NewHabitCard);
    const svg = wrapper.find("svg");
    expect(svg.exists()).toBe(true);
  });

  it("click dispara ui.openCreate", async () => {
    const ui = useUiStore();
    const openCreateSpy = vi.spyOn(ui, "openCreate");
    const wrapper = mount(NewHabitCard);
    await wrapper.trigger("click");
    expect(openCreateSpy).toHaveBeenCalledOnce();
  });

  it("tiene data-testid='new-habit-card' para tests E2E", () => {
    const wrapper = mount(NewHabitCard);
    expect(wrapper.find("[data-testid='new-habit-card']").exists()).toBe(true);
  });

  it("tiene aria-label accesible", () => {
    const wrapper = mount(NewHabitCard);
    const card = wrapper.find("[data-testid='new-habit-card']");
    expect(card.attributes("aria-label")).toBe("Crear nuevo hábito");
  });
});
