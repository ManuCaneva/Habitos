// =============================================================
// lib/db.ts — Único punto de contacto con Rust.
//
// Regla: todo lo que sale hacia Rust pasa por acá, y todo lo que
// vuelve de Rust se valida con Zod antes de llegar a un store.
// =============================================================

import { invoke } from "@tauri-apps/api/core";
import {
  CreateHabitDraftSchema,
  CreateHabitLogDraftSchema,
  type CreateHabitDraft,
  type CreateHabitLogDraft,
  HabitLogRowSchema,
  HabitRowSchema,
  type HabitLogRow,
  type HabitRow,
  type UpdateHabitDraft,
  UpdateHabitDraftSchema,
} from "../schemas/habits";
import {
  CreateTaskDraftSchema,
  type CreateTaskDraft,
  type UpdateTaskDraft,
  UpdateTaskDraftSchema,
  TaskRowSchema,
  type TaskRow,
  taskToRow,
} from "../schemas/tasks";
import {
  CreateGoalDraftSchema,
  type CreateGoalDraft,
  type UpdateGoalDraft,
  UpdateGoalDraftSchema,
  GoalRowSchema,
  type GoalRow,
  CreateGoalLogDraftSchema,
  type CreateGoalLogDraft,
  GoalLogRowSchema,
  type GoalLogRow,
  goalToRow,
} from "../schemas/goals";

interface CreateLogInput {
  id: string;
  habit_id: string;
  log_date: string;
  completed_at: string;
  note: string | null;
  created_at: string;
}

// ───────────────────────────────────────────────────────────────
// Hábitos
// ───────────────────────────────────────────────────────────────

export async function createHabit(
  draft: CreateHabitDraft,
  id: string,
  created_at: string,
  updated_at: string,
): Promise<HabitRow> {
  const validated = CreateHabitDraftSchema.parse(draft);
  const raw = await invoke<unknown>("create_habit", {
    input: {
      id,
      name: validated.name,
      description: validated.description ?? null,
      icon: validated.icon ?? null,
      color: validated.color,
      frequency: validated.frequency,
      sort_order: validated.sort_order ?? 0,
      created_at,
      updated_at,
    },
  });
  return HabitRowSchema.parse(raw);
}

export async function listHabits(includeArchived = false): Promise<HabitRow[]> {
  const raw = await invoke<unknown>("list_habits", { includeArchived });
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r) => HabitRowSchema.parse(r));
}

export async function updateHabit(
  id: string,
  patch: UpdateHabitDraft,
  updated_at: string,
): Promise<HabitRow> {
  const validated = UpdateHabitDraftSchema.parse(patch);
  const input = {
    id,
    name: validated.name,
    description: validated.description ?? undefined,
    icon: validated.icon ?? undefined,
    color: validated.color,
    frequency: validated.frequency,
    sort_order: validated.sort_order,
    updated_at,
  };
  const raw = await invoke<unknown>("update_habit", { input });
  return HabitRowSchema.parse(raw);
}

export async function archiveHabit(id: string, archived_at: string): Promise<void> {
  await invoke("archive_habit", { id, archivedAt: archived_at });
}

export async function restoreHabit(id: string, updated_at: string): Promise<void> {
  await invoke("restore_habit", { id, updatedAt: updated_at });
}

// ───────────────────────────────────────────────────────────────
// Logs
// ───────────────────────────────────────────────────────────────

export async function createLog(
  draft: CreateHabitLogDraft,
  id: string,
  completed_at: string,
  created_at: string,
): Promise<HabitLogRow> {
  const validated = CreateHabitLogDraftSchema.parse(draft);
  if (!validated.log_date) {
    throw new Error("createLog: log_date es obligatorio (calcular en el store)");
  }
  const input: CreateLogInput = {
    id,
    habit_id: validated.habit_id,
    log_date: validated.log_date,
    completed_at,
    note: validated.note ?? null,
    created_at,
  };
  const raw = await invoke<unknown>("create_log", { input });
  return HabitLogRowSchema.parse(raw);
}

export async function deleteLog(id: string): Promise<void> {
  await invoke("delete_log", { id });
}

export async function listLogsInRange(
  fromDate: string, // YYYY-MM-DD
  toDate: string,
  habitId?: string,
): Promise<HabitLogRow[]> {
  const raw = await invoke<unknown>("list_logs_in_range", {
    habitId: habitId ?? null,
    fromDate,
    toDate,
  });
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r) => HabitLogRowSchema.parse(r));
}

// ───────────────────────────────────────────────────────────────
// Tasks
// ───────────────────────────────────────────────────────────────

export async function createTask(
  draft: CreateTaskDraft,
  id: string,
  created_at: string,
  updated_at: string,
): Promise<TaskRow> {
  const validated = CreateTaskDraftSchema.parse(draft);
  const row = taskToRow(validated);
  const raw = await invoke<unknown>("create_task", {
    input: {
      id,
      title: row.title,
      description: row.description,
      color: row.color,
      status: row.status,
      due_date: row.due_date,
      steps: row.steps,
      sort_order: row.sort_order,
      created_at,
      updated_at,
    },
  });
  return TaskRowSchema.parse(raw);
}

export async function listTasks(): Promise<TaskRow[]> {
  const raw = await invoke<unknown>("list_tasks", {});
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r) => TaskRowSchema.parse(r));
}

export async function updateTask(
  id: string,
  patch: UpdateTaskDraft,
  updated_at: string,
): Promise<TaskRow> {
  const validated = UpdateTaskDraftSchema.parse(patch);
  const row = taskToRow(validated);
  const raw = await invoke<unknown>("update_task", {
    input: {
      id,
      title: row.title,
      description: row.description ?? undefined,
      color: row.color,
      status: row.status,
      due_date: row.due_date ?? undefined,
      steps: row.steps,
      sort_order: row.sort_order,
      updated_at,
    },
  });
  return TaskRowSchema.parse(raw);
}

export async function deleteTask(id: string): Promise<void> {
  await invoke("delete_task", { id });
}

// ───────────────────────────────────────────────────────────────
// Goals
// ───────────────────────────────────────────────────────────────

export async function createGoal(
  draft: CreateGoalDraft,
  id: string,
  created_at: string,
  updated_at: string,
): Promise<GoalRow> {
  const validated = CreateGoalDraftSchema.parse(draft);
  const row = goalToRow(validated);
  const raw = await invoke<unknown>("create_goal", {
    input: {
      id,
      title: row.title,
      description: row.description,
      color: row.color,
      target: validated.target,
      unit: row.unit,
      frequency_type: row.frequency_type,
      interval_days: row.interval_days,
      days_of_week: row.days_of_week,
      sort_order: row.sort_order,
      created_at,
      updated_at,
    },
  });
  return GoalRowSchema.parse(raw);
}

export async function listGoals(): Promise<GoalRow[]> {
  const raw = await invoke<unknown>("list_goals", {});
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r) => GoalRowSchema.parse(r));
}

export async function updateGoal(
  id: string,
  patch: UpdateGoalDraft,
  updated_at: string,
): Promise<GoalRow> {
  const validated = UpdateGoalDraftSchema.parse(patch);
  const row = goalToRow(validated);
  const raw = await invoke<unknown>("update_goal", {
    input: {
      id,
      title: row.title,
      description: row.description ?? undefined,
      color: row.color,
      target: validated.target,
      unit: row.unit ?? undefined,
      frequency_type: row.frequency_type,
      interval_days: row.interval_days,
      days_of_week: row.days_of_week,
      sort_order: row.sort_order,
      updated_at,
    },
  });
  return GoalRowSchema.parse(raw);
}

export async function deleteGoal(id: string): Promise<void> {
  await invoke("delete_goal", { id });
}

// ───────────────────────────────────────────────────────────────
// Goal Logs
// ───────────────────────────────────────────────────────────────

export async function upsertGoalLog(
  draft: CreateGoalLogDraft,
  id: string,
  created_at: string,
): Promise<GoalLogRow> {
  const validated = CreateGoalLogDraftSchema.parse(draft);
  if (!validated.log_date) {
    throw new Error("upsertGoalLog: log_date es obligatorio (calcular en el store)");
  }
  const raw = await invoke<unknown>("upsert_goal_log", {
    input: {
      id,
      goal_id: validated.goal_id,
      log_date: validated.log_date,
      amount: validated.amount ?? 1,
      note: validated.note ?? null,
      created_at,
    },
  });
  return GoalLogRowSchema.parse(raw);
}

export async function deleteGoalLog(id: string): Promise<void> {
  await invoke("delete_goal_log", { id });
}

export async function listGoalLogsInRange(
  fromDate: string, // YYYY-MM-DD
  toDate: string,
  goalId?: string,
): Promise<GoalLogRow[]> {
  const raw = await invoke<unknown>("list_goal_logs_in_range", {
    goalId: goalId ?? null,
    fromDate,
    toDate,
  });
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r) => GoalLogRowSchema.parse(r));
}

// ───────────────────────────────────────────────────────────────
// Config (key-value persistida en SQLite)
// ───────────────────────────────────────────────────────────────

export async function saveConfig(key: string, value: string): Promise<void> {
  await invoke("save_config", { key, value });
}

export async function loadConfig(key: string): Promise<string | null> {
  const raw = await invoke<string | null>("load_config", { key });
  return raw;
}
