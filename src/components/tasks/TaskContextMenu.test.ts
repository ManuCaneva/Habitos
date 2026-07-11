import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import TaskContextMenu from "./TaskContextMenu.vue";

const tasksMock = {
  archiveTask: vi.fn().mockResolvedValue(undefined),
  restoreTask: vi.fn().mockResolvedValue(undefined),
};
const uiMock = {
  openEditTask: vi.fn(),
  closeTaskMenu: vi.fn(),
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
  archived_at: null,
};

describe("TaskContextMenu", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    tasksMock.archiveTask.mockClear();
    tasksMock.restoreTask.mockClear();
    uiMock.openEditTask.mockClear();
    uiMock.closeTaskMenu.mockClear();
  });

  it("renders via EntityContextMenu", () => {
    const wrapper = mount(TaskContextMenu, {
      props: { task: mockTask },
    });
    expect(wrapper.findComponent({ name: "EntityContextMenu" }).exists()).toBe(true);
  });

  it("passes correct props to EntityContextMenu", () => {
    const wrapper = mount(TaskContextMenu, {
      props: { task: mockTask },
    });
    const ctx = wrapper.findComponent({ name: "EntityContextMenu" });
    expect(ctx.props("entityId")).toBe("task-1");
    expect(ctx.props("isArchived")).toBe(false);
    expect(ctx.props("triggerDataAttr")).toBe("data-task-menu-trigger");
  });

  it("passes isArchived=true when task is archived", () => {
    const wrapper = mount(TaskContextMenu, {
      props: { task: { ...mockTask, archived_at: "2026-01-01T00:00:00Z" } },
    });
    const ctx = wrapper.findComponent({ name: "EntityContextMenu" });
    expect(ctx.props("isArchived")).toBe(true);
  });
});
