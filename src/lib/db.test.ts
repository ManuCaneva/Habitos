import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  updateHabit,
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  createGoal,
  listGoals,
  updateGoal,
  deleteGoal,
  upsertGoalLog,
  deleteGoalLog,
  listGoalLogsInRange,
} from "./db";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

import { invoke } from "@tauri-apps/api/core";

const mockRow = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  name: "X",
  description: null,
  icon: null,
  color: "#5e6ad2",
  frequency_type: "daily",
  target_per_period: 1,
  interval_days: null,
  days_of_week: null,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-07-05T00:00:00.000Z",
  archived_at: null,
};

const mockTaskRow = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Test Task",
  description: null,
  color: "#ff5500",
  status: "todo",
  due_date: null,
  steps: "[]",
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-07-05T00:00:00.000Z",
  archived_at: null,
};

const mockGoalRow = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  title: "Test Goal",
  description: null,
  color: "#ff5500",
  target: 10,
  unit: null,
  frequency_type: "daily",
  interval_days: null,
  days_of_week: null,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-07-05T00:00:00.000Z",
  archived_at: null,
};

const mockGoalLogRow = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  goal_id: "223e4567-e89b-12d3-a456-426614174000",
  log_date: "2026-07-05",
  amount: 5,
  note: null,
  created_at: "2026-07-05T00:00:00.000Z",
};

describe("db.updateHabit - shape hacia Rust", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(mockRow);
  });

  it("aplana el patch al shape que espera Rust (no envía { patch: { ... } })", async () => {
    await updateHabit(
      "123e4567-e89b-12d3-a456-426614174000",
      { name: "Nuevo", color: "#eb5757", icon: "dumbbell" },
      "2026-07-05T00:00:00.000Z",
    );
    expect(invoke).toHaveBeenCalledWith(
      "update_habit",
      expect.objectContaining({
        input: expect.objectContaining({
          id: "123e4567-e89b-12d3-a456-426614174000",
          name: "Nuevo",
          color: "#eb5757",
          icon: "dumbbell",
          updated_at: "2026-07-05T00:00:00.000Z",
        }),
      }),
    );
    const call = vi.mocked(invoke).mock.calls[0];
    const input = (call[1] as { input: Record<string, unknown> }).input;
    expect(input).not.toHaveProperty("patch");
  });
});

describe("db.createTask - shape hacia Rust", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(mockTaskRow);
  });

  it("envía input con steps serializado como JSON string", async () => {
    await createTask(
      { title: "Test", color: "#ff5500", status: "todo", steps: [] },
      "123e4567-e89b-12d3-a456-426614174000",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    expect(invoke).toHaveBeenCalledWith("create_task", {
      input: expect.objectContaining({
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Test",
        color: "#ff5500",
        status: "todo",
        steps: "[]",
      }),
    });
  });

  it("rechaza draft inválido sin invocar", async () => {
    await expect(
      createTask(
        { title: "", color: "#ff5500" } as any,
        "123e4567-e89b-12d3-a456-426614174000",
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
      ),
    ).rejects.toThrow();
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("db.listTasks", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue([mockTaskRow]);
  });

  it("retorna array de TaskRow parseados", async () => {
    const result = await listTasks();
    expect(invoke).toHaveBeenCalledWith("list_tasks", { includeArchived: false });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Task");
  });
});

describe("db.updateTask - shape hacia Rust", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(mockTaskRow);
  });

  it("aplana el patch al shape que espera Rust", async () => {
    await updateTask(
      "123e4567-e89b-12d3-a456-426614174000",
      { title: "Nuevo", color: "#eb5757" },
      "2026-07-05T00:00:00.000Z",
    );
    expect(invoke).toHaveBeenCalledWith("update_task", {
      input: expect.objectContaining({
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Nuevo",
        color: "#eb5757",
        updated_at: "2026-07-05T00:00:00.000Z",
      }),
    });
  });
});

describe("db.deleteTask", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  it("envía id directamente", async () => {
    await deleteTask("123e4567-e89b-12d3-a456-426614174000");
    expect(invoke).toHaveBeenCalledWith("delete_task", {
      id: "123e4567-e89b-12d3-a456-426614174000",
    });
  });
});

describe("db.createGoal - shape hacia Rust", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(mockGoalRow);
  });

  it("envía input con frequency_type aplanado", async () => {
    await createGoal(
      { title: "Test", color: "#ff5500", target: 10, frequency: { type: "daily" } },
      "123e4567-e89b-12d3-a456-426614174000",
      "2026-01-01T00:00:00.000Z",
      "2026-01-01T00:00:00.000Z",
    );
    expect(invoke).toHaveBeenCalledWith("create_goal", {
      input: expect.objectContaining({
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Test",
        color: "#ff5500",
        target: 10,
        frequency_type: "daily",
        interval_days: null,
      }),
    });
  });

  it("rechaza draft inválido sin invocar", async () => {
    await expect(
      createGoal(
        { title: "", color: "#ff5500", target: 10, frequency: { type: "daily" } } as any,
        "123e4567-e89b-12d3-a456-426614174000",
        "2026-01-01T00:00:00.000Z",
        "2026-01-01T00:00:00.000Z",
      ),
    ).rejects.toThrow();
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("db.listGoals", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue([mockGoalRow]);
  });

  it("retorna array de GoalRow parseados", async () => {
    const result = await listGoals();
    expect(invoke).toHaveBeenCalledWith("list_goals", { includeArchived: false });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Goal");
  });
});

describe("db.updateGoal - shape hacia Rust", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(mockGoalRow);
  });

  it("aplana el patch al shape que espera Rust", async () => {
    await updateGoal(
      "123e4567-e89b-12d3-a456-426614174000",
      { title: "Nuevo", color: "#eb5757" },
      "2026-07-05T00:00:00.000Z",
    );
    expect(invoke).toHaveBeenCalledWith("update_goal", {
      input: expect.objectContaining({
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Nuevo",
        color: "#eb5757",
        updated_at: "2026-07-05T00:00:00.000Z",
      }),
    });
  });
});

describe("db.deleteGoal", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  it("envía id directamente", async () => {
    await deleteGoal("123e4567-e89b-12d3-a456-426614174000");
    expect(invoke).toHaveBeenCalledWith("delete_goal", {
      id: "123e4567-e89b-12d3-a456-426614174000",
    });
  });
});

describe("db.upsertGoalLog - shape hacia Rust", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(mockGoalLogRow);
  });

  it("envía input con amount y log_date", async () => {
    await upsertGoalLog(
      { goal_id: "223e4567-e89b-12d3-a456-426614174000", log_date: "2026-07-05", amount: 5 },
      "123e4567-e89b-12d3-a456-426614174000",
      "2026-07-05T00:00:00.000Z",
    );
    expect(invoke).toHaveBeenCalledWith("upsert_goal_log", {
      input: expect.objectContaining({
        id: "123e4567-e89b-12d3-a456-426614174000",
        goal_id: "223e4567-e89b-12d3-a456-426614174000",
        log_date: "2026-07-05",
        amount: 5,
        created_at: "2026-07-05T00:00:00.000Z",
      }),
    });
  });

  it("rechaza draft inválido sin invocar", async () => {
    await expect(
      upsertGoalLog(
        { goal_id: "223e4567-e89b-12d3-a456-426614174000", amount: 0 } as any,
        "123e4567-e89b-12d3-a456-426614174000",
        "2026-07-05T00:00:00.000Z",
      ),
    ).rejects.toThrow();
    expect(invoke).not.toHaveBeenCalled();
  });
});

describe("db.deleteGoalLog", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue(undefined);
  });

  it("envía id directamente", async () => {
    await deleteGoalLog("123e4567-e89b-12d3-a456-426614174000");
    expect(invoke).toHaveBeenCalledWith("delete_goal_log", {
      id: "123e4567-e89b-12d3-a456-426614174000",
    });
  });
});

describe("db.listGoalLogsInRange", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
    vi.mocked(invoke).mockResolvedValue([mockGoalLogRow]);
  });

  it("envía fromDate, toDate, goalId", async () => {
    const result = await listGoalLogsInRange("2026-07-01", "2026-07-31", "223e4567-e89b-12d3-a456-426614174000");
    expect(invoke).toHaveBeenCalledWith("list_goal_logs_in_range", {
      goalId: "223e4567-e89b-12d3-a456-426614174000",
      fromDate: "2026-07-01",
      toDate: "2026-07-31",
    });
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(5);
  });

  it("acepta goalId null para listar todos", async () => {
    await listGoalLogsInRange("2026-07-01", "2026-07-31");
    expect(invoke).toHaveBeenCalledWith("list_goal_logs_in_range", {
      goalId: null,
      fromDate: "2026-07-01",
      toDate: "2026-07-31",
    });
  });
});
