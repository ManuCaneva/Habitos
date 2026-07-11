import { describe, it, expect, vi, beforeEach } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useTasksStore, daysUntilDue, urgencyLevel, deadlineProgress } from "./tasks";
import * as db from "@/lib/db";

vi.mock("@/lib/db", () => ({
  listTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn().mockResolvedValue(undefined),
}));

function todayLocalDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("tasks store - createTask", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should generate id and timestamps, call db.createTask, and add to state", async () => {
    const store = useTasksStore();
    const draft = { title: "Test task", color: "#5e6ad2", status: "todo" as const, steps: [] };
    const mockRow = {
      id: "11111111-1111-1111-1111-111111111111",
      title: "Test task",
      description: null,
      color: "#5e6ad2",
      status: "todo",
      due_date: null,
      steps: "[]",
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(db.createTask).mockResolvedValue(mockRow);

    await store.createTask(draft);

    expect(db.createTask).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(db.createTask).mock.calls[0];
    expect(callArgs[0]).toEqual(draft);
    expect(typeof callArgs[1]).toBe("string");
    expect(typeof callArgs[2]).toBe("string");
    expect(typeof callArgs[3]).toBe("string");

    expect(store.tasks).toHaveLength(1);
    expect(store.tasks[0].id).toBe("11111111-1111-1111-1111-111111111111");
    expect(store.tasks[0].title).toBe("Test task");
  });

  it("should be immutable (replace state array)", async () => {
    const store = useTasksStore();
    const mockRow = {
      id: "11111111-1111-1111-1111-111111111111",
      title: "Test",
      description: null,
      color: "#5e6ad2",
      status: "todo",
      due_date: null,
      steps: "[]",
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    vi.mocked(db.createTask).mockResolvedValue(mockRow);

    const initialTasks = store.tasks;
    await store.createTask({ title: "Test", color: "#5e6ad2", status: "todo" as const, steps: [] });
    expect(store.tasks).not.toBe(initialTasks);
  });
});

describe("tasks store - loadTasks", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should load tasks and map rows", async () => {
    const store = useTasksStore();
    const now = new Date().toISOString();
    const mockRows = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        title: "Task 1",
        description: null,
        color: "#5e6ad2",
        status: "todo",
        due_date: null,
        steps: "[]",
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        title: "Task 2",
        description: null,
        color: "#ff0000",
        status: "doing",
        due_date: null,
        steps: '[{"id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","title":"Step 1","done":true}]',
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
    ];

    vi.mocked(db.listTasks).mockResolvedValue(mockRows);

    await store.loadTasks();

    expect(store.tasks).toHaveLength(2);
    expect(store.tasks[0].title).toBe("Task 1");
    expect(store.tasks[1].steps).toHaveLength(1);
    expect(store.tasks[1].steps[0].done).toBe(true);
  });
});

describe("tasks store - updateTask", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should call db.updateTask with id, patch, and updated_at", async () => {
    const store = useTasksStore();
    const now = new Date().toISOString();
    const taskId = "11111111-1111-1111-1111-111111111111";

    store.tasks = [
      {
        id: taskId,
        title: "Original",
        description: null,
        color: "#5e6ad2",
        status: "todo",
        due_date: null,
        steps: [],
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
    ];

    const mockRow = {
      id: taskId,
      title: "Updated",
      description: null,
      color: "#5e6ad2",
      status: "doing",
      due_date: null,
      steps: "[]",
      sort_order: 0,
      created_at: now,
      updated_at: new Date().toISOString(),
    };

    vi.mocked(db.updateTask).mockResolvedValue(mockRow);

    await store.updateTask(taskId, { title: "Updated", status: "doing" });

    expect(db.updateTask).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(db.updateTask).mock.calls[0];
    expect(callArgs[0]).toBe(taskId);
    expect(callArgs[1]).toEqual({ title: "Updated", status: "doing" });
    expect(typeof callArgs[2]).toBe("string");

    expect(store.tasks[0].title).toBe("Updated");
    expect(store.tasks[0].status).toBe("doing");
  });
});

describe("tasks store - deleteTask", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should call db.deleteTask and remove from state", async () => {
    const store = useTasksStore();
    const now = new Date().toISOString();
    const taskId = "11111111-1111-1111-1111-111111111111";

    store.tasks = [
      {
        id: taskId,
        title: "To delete",
        description: null,
        color: "#5e6ad2",
        status: "todo",
        due_date: null,
        steps: [],
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
    ];

    await store.deleteTask(taskId);

    expect(db.deleteTask).toHaveBeenCalledWith(taskId);
    expect(store.tasks).toHaveLength(0);
  });
});

describe("tasks store - toggleStep", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should toggle step done status and call updateTask", async () => {
    const store = useTasksStore();
    const now = new Date().toISOString();
    const taskId = "11111111-1111-1111-1111-111111111111";
    const stepId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

    store.tasks = [
      {
        id: taskId,
        title: "Task",
        description: null,
        color: "#5e6ad2",
        status: "todo",
        due_date: null,
        steps: [{ id: stepId, title: "Step 1", done: false }],
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
    ];

    const mockRow = {
      id: taskId,
      title: "Task",
      description: null,
      color: "#5e6ad2",
      status: "todo",
      due_date: null,
      steps: '[{"id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","title":"Step 1","done":true}]',
      sort_order: 0,
      created_at: now,
      updated_at: new Date().toISOString(),
    };

    vi.mocked(db.updateTask).mockResolvedValue(mockRow);

    await store.toggleStep(taskId, stepId);

    expect(db.updateTask).toHaveBeenCalledTimes(1);
    const callArgs = vi.mocked(db.updateTask).mock.calls[0];
    expect(callArgs[0]).toBe(taskId);
    expect(callArgs[1]).toHaveProperty("steps");
    const steps = callArgs[1].steps;
    expect(steps).toHaveLength(1);
    expect(steps![0].done).toBe(true);

    expect(store.tasks[0].steps[0].done).toBe(true);
  });
});

describe("tasks store - pendingTasks", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it("should filter out tasks with status 'done'", async () => {
    const store = useTasksStore();
    const now = new Date().toISOString();

    store.tasks = [
      {
        id: "11111111-1111-1111-1111-111111111111",
        title: "Pending",
        description: null,
        color: "#5e6ad2",
        status: "todo",
        due_date: null,
        steps: [],
        sort_order: 0,
        created_at: now,
        updated_at: now,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        title: "Done",
        description: null,
        color: "#ff0000",
        status: "done",
        due_date: null,
        steps: [],
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: "33333333-3333-3333-3333-333333333333",
        title: "Doing",
        description: null,
        color: "#00ff00",
        status: "doing",
        due_date: null,
        steps: [],
        sort_order: 2,
        created_at: now,
        updated_at: now,
      },
    ];

    expect(store.pendingTasks).toHaveLength(2);
    expect(store.pendingTasks[0].status).toBe("todo");
    expect(store.pendingTasks[1].status).toBe("doing");
  });
});

describe("daysUntilDue", () => {
  it("should return positive days for future date", () => {
    const today = todayLocalDate();
    const future = addDays(today, 5);
    expect(daysUntilDue(future)).toBe(5);
  });

  it("should return negative days for past date", () => {
    const today = todayLocalDate();
    const past = addDays(today, -3);
    expect(daysUntilDue(past)).toBe(-3);
  });

  it("should return 0 for today", () => {
    const today = todayLocalDate();
    expect(daysUntilDue(today)).toBe(0);
  });
});

describe("urgencyLevel", () => {
  it("should return 'none' for null due_date", () => {
    expect(urgencyLevel(null)).toBe("none");
  });

  it("should return 'overdue' for past date", () => {
    const today = todayLocalDate();
    const past = addDays(today, -1);
    expect(urgencyLevel(past)).toBe("overdue");
  });

  it("should return 'warning' for date <= 3 days", () => {
    const today = todayLocalDate();
    expect(urgencyLevel(today)).toBe("warning");
    expect(urgencyLevel(addDays(today, 1))).toBe("warning");
    expect(urgencyLevel(addDays(today, 2))).toBe("warning");
    expect(urgencyLevel(addDays(today, 3))).toBe("warning");
  });

  it("should return 'normal' for date > 3 days", () => {
    const today = todayLocalDate();
    expect(urgencyLevel(addDays(today, 4))).toBe("normal");
    expect(urgencyLevel(addDays(today, 10))).toBe("normal");
  });
});

describe("deadlineProgress", () => {
  it("should return null for null due_date", () => {
    const now = new Date().toISOString();
    expect(deadlineProgress(now, null)).toBeNull();
  });

  it("should return null if due_date <= created_at", () => {
    const createdDate = "2026-01-01";
    const dueDate = "2025-12-31";
    expect(deadlineProgress(createdDate, dueDate)).toBeNull();
  });

  it("should return 0 if today == created_at", () => {
    const today = todayLocalDate();
    const createdDate = today;
    const dueDate = addDays(today, 10);
    expect(deadlineProgress(createdDate, dueDate)).toBe(0);
  });

  it("should return 1 if today >= due_date", () => {
    const today = todayLocalDate();
    const createdDate = addDays(today, -10);
    const dueDate = addDays(today, -1);
    expect(deadlineProgress(createdDate, dueDate)).toBe(1);
  });

  it("should return progress between 0 and 1", () => {
    const today = todayLocalDate();
    const createdDate = addDays(today, -5);
    const dueDate = addDays(today, 5);
    const progress = deadlineProgress(createdDate, dueDate);
    expect(progress).not.toBeNull();
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThan(1);
  });
});
