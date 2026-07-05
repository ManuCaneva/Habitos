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
