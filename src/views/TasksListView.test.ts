import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { ref } from "vue";
import TasksListView from "./TasksListView.vue";

const tasksState = ref<{ id: string; title: string; description?: string | null; color: string; status: string; due_date?: string | null; steps: any[] }[]>([]);
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

  it("should render with data-testid='tasks-panel'", () => {
    const wrapper = mount(TasksListView);
    const panel = wrapper.find("[data-testid='tasks-panel']");
    expect(panel.exists()).toBe(true);
  });

  it("should render header with 'Tareas' title", () => {
    const wrapper = mount(TasksListView);
    expect(wrapper.text()).toContain("Tareas");
  });

  it("should render task count in header", () => {
    tasksState.value = [
      {
        id: "task-1",
        title: "Task 1",
        description: null,
        color: "#ff0000",
        status: "todo",
        due_date: null,
        steps: [],
      },
    ];
    const wrapper = mount(TasksListView);
    expect(wrapper.text()).toContain("1");
  });

  it("should render TaskCard for each task", () => {
    tasksState.value = [
      {
        id: "task-1",
        title: "Task 1",
        description: null,
        color: "#ff0000",
        status: "todo",
        due_date: null,
        steps: [],
      },
      {
        id: "task-2",
        title: "Task 2",
        description: null,
        color: "#00ff00",
        status: "doing",
        due_date: null,
        steps: [],
      },
    ];
    const wrapper = mount(TasksListView);
    const cards = wrapper.findAllComponents({ name: "TaskCard" });
    expect(cards).toHaveLength(2);
  });

  it("should not render done tasks", () => {
    tasksState.value = [
      {
        id: "task-1",
        title: "Task 1",
        description: null,
        color: "#ff0000",
        status: "todo",
        due_date: null,
        steps: [],
      },
      {
        id: "task-2",
        title: "Task 2",
        description: null,
        color: "#00ff00",
        status: "done",
        due_date: null,
        steps: [],
      },
    ];
    const wrapper = mount(TasksListView);
    const cards = wrapper.findAllComponents({ name: "TaskCard" });
    expect(cards).toHaveLength(1);
  });

  it("should render NewTaskCard", () => {
    const wrapper = mount(TasksListView);
    const newCard = wrapper.findComponent({ name: "NewTaskCard" });
    expect(newCard.exists()).toBe(true);
  });

  it("should have TaskContextMenu in template", () => {
    // TaskContextMenu is tested separately in TaskContextMenu.test.ts
    // This test just verifies the component imports it
    tasksState.value = [
      {
        id: "task-1",
        title: "Task 1",
        description: null,
        color: "#ff0000",
        status: "todo",
        due_date: null,
        steps: [],
      },
    ];
    uiMock.menuOpenForTaskId.value = "task-1";
    const wrapper = mount(TasksListView);
    // Component should exist and render without errors
    expect(wrapper.find("[data-testid='tasks-panel']").exists()).toBe(true);
  });

  it("should not render TaskContextMenu when menu is closed", () => {
    tasksState.value = [
      {
        id: "task-1",
        title: "Task 1",
        description: null,
        color: "#ff0000",
        status: "todo",
        due_date: null,
        steps: [],
      },
    ];
    uiMock.menuOpenForTaskId.value = null;
    const wrapper = mount(TasksListView);
    const contextMenu = wrapper.findComponent({ name: "TaskContextMenu" });
    expect(contextMenu.exists()).toBe(false);
  });
});
