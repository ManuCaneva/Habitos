import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import GoalContextMenu from "./GoalContextMenu.vue";

const goalsMock = {
  deleteGoal: vi.fn().mockResolvedValue(undefined),
};
const uiState = {
  menuOpenForGoalId: ref<string | null>(null),
  editingGoalId: ref<string | null>(null),
  createGoalOpen: ref(false),
};
const uiMock = {
  get menuOpenForGoalId() {
    return uiState.menuOpenForGoalId.value;
  },
  set menuOpenForGoalId(v: string | null) {
    uiState.menuOpenForGoalId.value = v;
  },
  get editingGoalId() {
    return uiState.editingGoalId.value;
  },
  set editingGoalId(v: string | null) {
    uiState.editingGoalId.value = v;
  },
  get createGoalOpen() {
    return uiState.createGoalOpen.value;
  },
  set createGoalOpen(v: boolean) {
    uiState.createGoalOpen.value = v;
  },
  openEditGoal: (id: string) => {
    uiState.editingGoalId.value = id;
    uiState.createGoalOpen.value = true;
    uiState.menuOpenForGoalId.value = null;
  },
  closeGoalMenu: () => {
    uiState.menuOpenForGoalId.value = null;
  },
};
vi.mock("@/stores/goals", () => ({
  useGoalsStore: () => goalsMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

const mockGoal = {
  id: "goal-1",
  title: "Test Goal",
  description: null,
  color: "#00ff00",
  target: 10,
  unit: null,
  frequency: { type: "daily" as const },
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("GoalContextMenu", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    uiState.menuOpenForGoalId.value = "goal-1";
    uiState.editingGoalId.value = null;
    uiState.createGoalOpen.value = false;
    
    const trigger = document.createElement("div");
    trigger.setAttribute("data-goal-menu-trigger", "goal-1");
    document.body.appendChild(trigger);
    
    wrapper = mount(GoalContextMenu, {
      props: { goal: mockGoal },
      attachTo: document.body,
    });
  });

  afterEach(() => {
    wrapper.unmount();
    const trigger = document.querySelector("[data-goal-menu-trigger='goal-1']");
    if (trigger) trigger.remove();
  });

  it("should render menu with role='menu'", () => {
    const menu = document.body.querySelector("[role='menu']");
    expect(menu).not.toBeNull();
  });

  it("should have Editar option", () => {
    const menu = document.body.querySelector("[role='menu']");
    expect(menu?.textContent).toContain("Editar");
  });

  it("should have Eliminar option", () => {
    const menu = document.body.querySelector("[role='menu']");
    expect(menu?.textContent).toContain("Eliminar");
  });

  it("should call openEditGoal when Editar clicked", async () => {
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const editBtn = buttons.find(btn => btn.textContent?.includes("Editar"));
    editBtn?.click();
    await flushPromises();
    expect(uiState.editingGoalId.value).toBe("goal-1");
    expect(uiState.createGoalOpen.value).toBe(true);
  });

  it("should call deleteGoal when Eliminar clicked", async () => {
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const deleteBtn = buttons.find(btn => btn.textContent?.includes("Eliminar"));
    deleteBtn?.click();
    await flushPromises();
    expect(goalsMock.deleteGoal).toHaveBeenCalledWith("goal-1");
  });

  it("should close menu after delete", async () => {
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const deleteBtn = buttons.find(btn => btn.textContent?.includes("Eliminar"));
    deleteBtn?.click();
    await flushPromises();
    expect(uiState.menuOpenForGoalId.value).toBeNull();
  });
});
