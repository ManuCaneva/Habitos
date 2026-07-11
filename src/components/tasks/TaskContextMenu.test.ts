import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import TaskContextMenu from "./TaskContextMenu.vue";

const tasksMock = {
  deleteTask: vi.fn().mockResolvedValue(undefined),
};
const uiState = {
  menuOpenForTaskId: ref<string | null>(null),
  editingTaskId: ref<string | null>(null),
  createTaskOpen: ref(false),
};
const uiMock = {
  get menuOpenForTaskId() {
    return uiState.menuOpenForTaskId.value;
  },
  set menuOpenForTaskId(v: string | null) {
    uiState.menuOpenForTaskId.value = v;
  },
  get editingTaskId() {
    return uiState.editingTaskId.value;
  },
  set editingTaskId(v: string | null) {
    uiState.editingTaskId.value = v;
  },
  get createTaskOpen() {
    return uiState.createTaskOpen.value;
  },
  set createTaskOpen(v: boolean) {
    uiState.createTaskOpen.value = v;
  },
  openEditTask: (id: string) => {
    uiState.editingTaskId.value = id;
    uiState.createTaskOpen.value = true;
    uiState.menuOpenForTaskId.value = null;
  },
  closeTaskMenu: () => {
    uiState.menuOpenForTaskId.value = null;
  },
};
vi.mock("@/stores/tasks", () => ({
  useTasksStore: () => tasksMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

const mockTask = {
  id: "task-1",
  title: "Test Task",
  description: null,
  color: "#ff0000",
  status: "todo" as const,
  due_date: null,
  steps: [],
  sort_order: 0,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("TaskContextMenu", () => {
  let wrapper: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    uiState.menuOpenForTaskId.value = "task-1";
    uiState.editingTaskId.value = null;
    uiState.createTaskOpen.value = false;
    
    const trigger = document.createElement("div");
    trigger.setAttribute("data-task-menu-trigger", "task-1");
    document.body.appendChild(trigger);
    
    wrapper = mount(TaskContextMenu, {
      props: { task: mockTask },
      attachTo: document.body,
    });
  });

  afterEach(() => {
    wrapper.unmount();
    const trigger = document.querySelector("[data-task-menu-trigger='task-1']");
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

  it("should call openEditTask when Editar clicked", async () => {
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const editBtn = buttons.find(btn => btn.textContent?.includes("Editar"));
    editBtn?.click();
    await flushPromises();
    expect(uiState.editingTaskId.value).toBe("task-1");
    expect(uiState.createTaskOpen.value).toBe(true);
  });

  it("should call deleteTask when Eliminar clicked", async () => {
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const deleteBtn = buttons.find(btn => btn.textContent?.includes("Eliminar"));
    deleteBtn?.click();
    await flushPromises();
    expect(tasksMock.deleteTask).toHaveBeenCalledWith("task-1");
  });

  it("should close menu after delete", async () => {
    const buttons = Array.from(document.body.querySelectorAll("button"));
    const deleteBtn = buttons.find(btn => btn.textContent?.includes("Eliminar"));
    deleteBtn?.click();
    await flushPromises();
    expect(uiState.menuOpenForTaskId.value).toBeNull();
  });
});
