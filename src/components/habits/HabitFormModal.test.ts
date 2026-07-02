import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import HabitFormModal from "./HabitFormModal.vue";

const habitsMock = {
  habits: [],
  createHabit: vi.fn().mockResolvedValue({}),
  updateHabit: vi.fn().mockResolvedValue({}),
};
const uiMock = {
  createHabitOpen: true,
  editingHabitId: null as string | null,
  closeModal: vi.fn(),
};
vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => habitsMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

function iconOptions() {
  return document.body.querySelectorAll<HTMLElement>("[data-testid='icon-option']");
}

function getForm() {
  return document.body.querySelector<HTMLFormElement>("form")!;
}

function setInputValue(form: HTMLFormElement, value: string) {
  const input = form.querySelector("input")!;
  const nativeSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    "value",
  )!.set!;
  nativeSetter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

describe("HabitFormModal", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    uiMock.createHabitOpen = true;
    uiMock.editingHabitId = null;
    uiMock.closeModal.mockClear();
    habitsMock.createHabit.mockClear();
    habitsMock.updateHabit.mockClear();
    document.body.innerHTML = "";
  });

  it("rendera grilla de iconos seleccionable", () => {
    mount(HabitFormModal, { attachTo: document.body });
    expect(iconOptions().length).toBeGreaterThan(0);
  });

  it("selecciona un icono al hacer click", async () => {
    const w = mount(HabitFormModal, { attachTo: document.body });
    const icons = iconOptions();
    icons[0].click();
    await w.vm.$nextTick();
    expect(icons[0].classList.contains("selected")).toBe(true);
  });

  it("incluye icon en el draft de creación", async () => {
    const w = mount(HabitFormModal, { attachTo: document.body });
    const form = getForm();
    setInputValue(form, "Test habit");
    await w.vm.$nextTick();
    iconOptions()[2].click();
    await w.vm.$nextTick();
    form.requestSubmit();
    await flushPromises();
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({ icon: expect.any(String) }),
    );
  });
});
