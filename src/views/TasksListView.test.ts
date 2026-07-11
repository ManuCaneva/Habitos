import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import TasksListView from "./TasksListView.vue";

const tasksState = ref<{ id: string; title: string; description?: string | null; color: string; status: string; due_date?: string | null; steps: any[]; archived_at?: string | null }[]>([]);
const tasksMock = {
  get tasks() {
    return tasksState.value;
  },
  get pendingTasks() {
    return tasksState.value.filter((t) => t.status !== "done");
  },
};
const uiMock = {
  menuOpenForTaskId: ref<string | null>(null),
  toggleTaskMenu: vi.fn(),
  openEditTask: vi.fn(),
};
vi.mock("@/stores/tasks", () => ({
  useTasksStore: () => tasksMock,
}));
vi.mock("@/stores/ui", () => ({
  useUiStore: () => uiMock,
}));

describe("TasksListView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    tasksState.value = [];
    uiMock.menuOpenForTaskId.value = null;
  });

  it("usa EntityListing con título 'Tareas'", () => {
    const wrapper = mount(TasksListView);
    const listing = wrapper.findComponent({ name: "EntityListing" });
    expect(listing.exists()).toBe(true);
    expect(listing.props("title")).toBe("Tareas");
  });

  it("panel tiene data-testid", () => {
    const wrapper = mount(TasksListView);
    expect(wrapper.find("[data-testid='tasks-panel']").exists()).toBe(true);
  });

  it("muestra título 'Tareas'", () => {
    const wrapper = mount(TasksListView);
    expect(wrapper.text()).toContain("Tareas");
  });

  it("no muestra contador", () => {
    tasksState.value = [
      { id: "task-1", title: "Task 1", description: null, color: "#ff0000", status: "todo", due_date: null, steps: [], archived_at: null },
    ];
    const wrapper = mount(TasksListView);
    expect(wrapper.text()).not.toContain("·");
  });

  it("renderiza TaskCard por cada tarea", () => {
    tasksState.value = [
      { id: "task-1", title: "Task 1", description: null, color: "#ff0000", status: "todo", due_date: null, steps: [], archived_at: null },
      { id: "task-2", title: "Task 2", description: null, color: "#00ff00", status: "doing", due_date: null, steps: [], archived_at: null },
    ];
    const wrapper = mount(TasksListView);
    expect(wrapper.findAllComponents({ name: "TaskCard" })).toHaveLength(2);
  });

  it("no renderiza tareas done", () => {
    tasksState.value = [
      { id: "task-1", title: "Task 1", description: null, color: "#ff0000", status: "todo", due_date: null, steps: [], archived_at: null },
      { id: "task-2", title: "Task 2", description: null, color: "#00ff00", status: "done", due_date: null, steps: [], archived_at: null },
    ];
    const wrapper = mount(TasksListView);
    expect(wrapper.findAllComponents({ name: "TaskCard" })).toHaveLength(1);
  });

  it("renderiza NewTaskCard", () => {
    const wrapper = mount(TasksListView);
    expect(wrapper.findComponent({ name: "NewTaskCard" }).exists()).toBe(true);
  });

  it("TaskContextMenu aparece cuando el menú está abierto", () => {
    tasksState.value = [
      { id: "task-1", title: "Task 1", description: null, color: "#ff0000", status: "todo", due_date: null, steps: [], archived_at: null },
    ];
    uiMock.menuOpenForTaskId.value = "task-1";
    const wrapper = mount(TasksListView);
    expect(wrapper.find("[data-testid='tasks-panel']").exists()).toBe(true);
  });

  it("TaskContextMenu no aparece cuando el menú está cerrado", () => {
    tasksState.value = [
      { id: "task-1", title: "Task 1", description: null, color: "#ff0000", status: "todo", due_date: null, steps: [], archived_at: null },
    ];
    uiMock.menuOpenForTaskId.value = null;
    const wrapper = mount(TasksListView);
    expect(wrapper.findComponent({ name: "TaskContextMenu" }).exists()).toBe(false);
  });
});
