import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import HabitFormModal from "./HabitFormModal.vue";

const habitsState = ref<{ id: string; name: string; color: string; icon: string | null }[]>([]);
const habitsMock = {
  get habits() {
    return habitsState.value;
  },
  createHabit: vi.fn().mockResolvedValue({}),
  updateHabit: vi.fn().mockResolvedValue({}),
};
const uiState = {
  createHabitOpen: ref(true),
  editingHabitId: ref<string | null>(null),
  closeModal: vi.fn(),
};
const uiMock = {
  get createHabitOpen() {
    return uiState.createHabitOpen.value;
  },
  set createHabitOpen(v: boolean) {
    uiState.createHabitOpen.value = v;
  },
  get editingHabitId() {
    return uiState.editingHabitId.value;
  },
  set editingHabitId(v: string | null) {
    uiState.editingHabitId.value = v;
  },
  closeModal: () => {
    uiState.closeModal();
    uiState.createHabitOpen.value = false;
    uiState.editingHabitId.value = null;
  },
};
vi.mock("@/stores/habits", () => ({
  useHabitsStore: () => habitsMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

const wrappers: VueWrapper[] = [];
function mountModal(): VueWrapper {
  const w = mount(HabitFormModal, { attachTo: document.body });
  wrappers.push(w);
  return w;
}

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
    uiState.createHabitOpen.value = true;
    uiState.editingHabitId.value = null;
    uiState.closeModal.mockClear();
    habitsMock.createHabit.mockClear();
    habitsMock.updateHabit.mockClear();
    habitsState.value = [];
  });

  afterEach(async () => {
    for (const w of wrappers.splice(0)) {
      w.unmount();
    }
    document.body.innerHTML = "";
    await flushPromises();
  });

  it("rendera grilla de iconos seleccionable", () => {
    mountModal();
    expect(iconOptions().length).toBeGreaterThan(0);
  });

  it("selecciona un icono al hacer click", async () => {
    const w = mountModal();
    const icons = iconOptions();
    icons[0].click();
    await w.vm.$nextTick();
    expect(icons[0].classList.contains("selected")).toBe(true);
  });

  it("incluye icon en el draft de creación", async () => {
    const w = mountModal();
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

  describe("modo edición", () => {
    it("abre con los valores del hábito pre-llenados", async () => {
      habitsState.value = [
        { id: "h1", name: "Meditar", color: "#5e6ad2", icon: "footprints" },
      ];
      uiState.createHabitOpen.value = false;
      uiState.editingHabitId.value = null;
      mountModal();
      await flushPromises();
      uiState.editingHabitId.value = "h1";
      uiState.createHabitOpen.value = true;
      await flushPromises();
      const input = getForm().querySelector<HTMLInputElement>("input")!;
      expect(input.value).toBe("Meditar");
      const pressed = document.body.querySelector<HTMLButtonElement>(
        "button[aria-pressed='true'][aria-label='Lavanda']",
      );
      expect(pressed).toBeTruthy();
    });

    it("submit en edición llama updateHabit con los valores nuevos", async () => {
      habitsState.value = [
        { id: "h1", name: "Meditar", color: "#5e6ad2", icon: "footprints" },
      ];
      uiState.createHabitOpen.value = false;
      uiState.editingHabitId.value = null;
      const w = mountModal();
      await flushPromises();
      uiState.editingHabitId.value = "h1";
      uiState.createHabitOpen.value = true;
      await flushPromises();
      const form = getForm();
      setInputValue(form, "Otro nombre");
      await w.vm.$nextTick();
      const rojo = document.body.querySelector<HTMLButtonElement>(
        "button[aria-label='Rojo']",
      )!;
      rojo.click();
      await w.vm.$nextTick();
      form.requestSubmit();
      await flushPromises();
      expect(habitsMock.updateHabit).toHaveBeenCalledWith(
        "h1",
        expect.objectContaining({
          name: "Otro nombre",
          color: "#eb5757",
          icon: expect.any(String),
        }),
      );
    });

    it("submit en edición cierra el modal (createHabitOpen=false)", async () => {
      habitsState.value = [
        { id: "h1", name: "Meditar", color: "#5e6ad2", icon: "footprints" },
      ];
      uiState.createHabitOpen.value = false;
      uiState.editingHabitId.value = null;
      const w = mountModal();
      await flushPromises();
      uiState.editingHabitId.value = "h1";
      uiState.createHabitOpen.value = true;
      await flushPromises();
      const form = getForm();
      setInputValue(form, "X");
      await w.vm.$nextTick();
      form.requestSubmit();
      await flushPromises();
      expect(uiState.createHabitOpen.value).toBe(false);
      expect(uiState.editingHabitId.value).toBe(null);
    });
  });
});
