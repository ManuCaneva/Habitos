import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises, type VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import GoalFormModal from "./GoalFormModal.vue";

const goalsState = ref<{ id: string; title: string; description?: string | null; color: string; target: number; unit?: string | null; frequency: any }[]>([]);
const goalsMock = {
  get goals() {
    return goalsState.value;
  },
  createGoal: vi.fn().mockResolvedValue({}),
  updateGoal: vi.fn().mockResolvedValue({}),
};
const uiState = {
  createGoalOpen: ref(true),
  editingGoalId: ref<string | null>(null),
};
const uiMock = {
  get createGoalOpen() {
    return uiState.createGoalOpen.value;
  },
  set createGoalOpen(v: boolean) {
    uiState.createGoalOpen.value = v;
  },
  get editingGoalId() {
    return uiState.editingGoalId.value;
  },
  set editingGoalId(v: string | null) {
    uiState.editingGoalId.value = v;
  },
  closeGoalModal: () => {
    uiState.createGoalOpen.value = false;
    uiState.editingGoalId.value = null;
  },
  openCreateGoal: () => {
    uiState.createGoalOpen.value = true;
    uiState.editingGoalId.value = null;
  },
  openEditGoal: (id: string) => {
    uiState.createGoalOpen.value = true;
    uiState.editingGoalId.value = id;
  },
};
vi.mock("@/stores/goals", () => ({
  useGoalsStore: () => goalsMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

describe("GoalFormModal", () => {
  let wrapper: VueWrapper;

  beforeEach(() => {
    setActivePinia(createPinia());
    goalsState.value = [];
    uiState.createGoalOpen.value = true;
    uiState.editingGoalId.value = null;
    wrapper = mount(GoalFormModal, { attachTo: document.body });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  it("should render modal with title 'Nuevo objetivo' when creating", () => {
    const modal = document.body.querySelector("[role='dialog']");
    expect(modal?.textContent).toContain("Nuevo objetivo");
  });

  it("should render modal with title 'Editar objetivo' when editing", async () => {
    goalsState.value = [
      {
        id: "goal-1",
        title: "Test Goal",
        description: null,
        color: "#00ff00",
        target: 10,
        unit: null,
        frequency: { type: "daily" },
      },
    ];
    uiMock.openEditGoal("goal-1");
    await flushPromises();

    const modal = document.body.querySelector("[role='dialog']");
    expect(modal?.textContent).toContain("Editar objetivo");
  });

  it("should have title input", () => {
    const input = document.body.querySelector("input[type='text']");
    expect(input).not.toBeNull();
  });

  it("should have description textarea", () => {
    const textarea = document.body.querySelector("textarea");
    expect(textarea).not.toBeNull();
  });

  it("should have target input", () => {
    const input = document.body.querySelector("input[type='number']");
    expect(input).not.toBeNull();
  });

  it("should have unit input", () => {
    const inputs = Array.from(document.body.querySelectorAll("input[type='text']"));
    const unitInput = inputs.find(i => i.getAttribute("placeholder")?.includes("unidad"));
    expect(unitInput).not.toBeNull();
  });

  it("should have color picker", () => {
    const colorButtons = document.body.querySelectorAll("[data-testid='color-option']");
    expect(colorButtons.length).toBeGreaterThan(0);
  });

  it("should have frequency selector", () => {
    const modal = document.body.querySelector("[role='dialog']");
    expect(modal?.textContent).toContain("Diario");
    expect(modal?.textContent).toContain("Semanal");
    expect(modal?.textContent).toContain("Intervalo");
  });

  it("should call goals.createGoal on submit when creating", async () => {
    const titleInput = document.body.querySelector("input[type='text']") as HTMLInputElement;
    titleInput.value = "New Goal";
    titleInput.dispatchEvent(new Event("input", { bubbles: true }));

    const targetInput = document.body.querySelector("input[type='number']") as HTMLInputElement;
    targetInput.value = "10";
    targetInput.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();

    const form = document.body.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    await flushPromises();

    expect(goalsMock.createGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "New Goal",
        target: 10,
      }),
    );
  });

  it("should call goals.updateGoal on submit when editing", async () => {
    goalsState.value = [
      {
        id: "goal-1",
        title: "Old Title",
        description: null,
        color: "#00ff00",
        target: 5,
        unit: null,
        frequency: { type: "daily" },
      },
    ];
    uiMock.openEditGoal("goal-1");
    await flushPromises();

    const titleInput = document.body.querySelector("input[type='text']") as HTMLInputElement;
    titleInput.value = "New Title";
    titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();

    const form = document.body.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    await flushPromises();

    expect(goalsMock.updateGoal).toHaveBeenCalledWith(
      "goal-1",
      expect.objectContaining({
        title: "New Title",
      }),
    );
  });

  it("should close modal on cancel button click", async () => {
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const cancelBtn = buttons.find(btn => btn.textContent?.includes("Cancelar")) as HTMLButtonElement;
    cancelBtn.click();
    await flushPromises();
    expect(uiState.createGoalOpen.value).toBe(false);
  });

  it("should show error when title is empty on submit", async () => {
    const titleInput = document.body.querySelector("input[type='text']") as HTMLInputElement;
    titleInput.value = "";
    titleInput.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();

    const form = document.body.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    await flushPromises();

    const modal = document.body.querySelector("[role='dialog']");
    expect(modal?.textContent).toContain("El título no puede estar vacío");
  });

  it("should show error when target is less than 1 on submit", async () => {
    const titleInput = document.body.querySelector("input[type='text']") as HTMLInputElement;
    titleInput.value = "Test Goal";
    titleInput.dispatchEvent(new Event("input", { bubbles: true }));

    const targetInput = document.body.querySelector("input[type='number']") as HTMLInputElement;
    targetInput.value = "0";
    targetInput.dispatchEvent(new Event("input", { bubbles: true }));
    await flushPromises();

    const form = document.body.querySelector("form") as HTMLFormElement;
    form.dispatchEvent(new Event("submit", { bubbles: true }));
    await flushPromises();

    const modal = document.body.querySelector("[role='dialog']");
    expect(modal?.textContent).toContain("El objetivo debe ser al menos 1");
  });
});
