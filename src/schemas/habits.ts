// =============================================================
// schemas/habits.ts
//
// DOS CAPAS:
//   1) Habit / HabitLog  → modelo de dominio (lo que consume Pinia/Vue).
//   2) HabitRow / HabitLogRow → espejo exacto de las columnas SQLite
//      (valida lo que Rust devuelve por la frontera Tauri antes de mappear).
//
// Los mappers rowToHabit / habitToRow son el único punto de aplanado
// entre la frecuencia polimórfica y las columnas SQLite.
// =============================================================

import { z } from "zod";

// ───────────────────────────────────────────────────────────────
// Primitivos
// ───────────────────────────────────────────────────────────────

const uuid = z.string().uuid();

const isoTimestamp = z
  .string()
  .datetime({ offset: true })
  .describe("ISO 8601 UTC con offset, ej: 2026-06-27T14:30:00.000Z");

const localDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "log_date debe ser YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(s + "T00:00:00")), "Fecha inválida");

const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "color debe ser #RRGGBB");

const trimmed = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(min).max(max));

// ───────────────────────────────────────────────────────────────
// Frecuencia (discriminated union)
// ───────────────────────────────────────────────────────────────

const FrequencyBase = z.object({
  target_per_period: z.number().int().min(1).max(7).default(1),
});

const DailyFrequency = FrequencyBase.extend({
  type: z.literal("daily"),
});

const WeeklyFrequency = FrequencyBase.extend({
  type: z.literal("weekly"),
});

const IntervalFrequency = FrequencyBase.extend({
  type: z.literal("interval"),
  interval_days: z.number().int().min(1).max(365),
});

export const HabitFrequencySchema = z.discriminatedUnion("type", [
  DailyFrequency,
  WeeklyFrequency,
  IntervalFrequency,
]);

export type HabitFrequency = z.infer<typeof HabitFrequencySchema>;

// ───────────────────────────────────────────────────────────────
// Entidad de dominio: Habit
// ───────────────────────────────────────────────────────────────

export const HabitSchema = z.object({
  id: uuid,
  name: trimmed(1, 100),
  description: z.string().trim().max(500).nullable().default(null),
  icon: z.string().trim().max(32).nullable().default(null),
  color: hexColor,
  frequency: HabitFrequencySchema,
  sort_order: z.number().int().default(0),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
  archived_at: isoTimestamp.nullable().default(null),
});

export type Habit = z.infer<typeof HabitSchema>;

// ───────────────────────────────────────────────────────────────
// Entidad de dominio: HabitLog
// ───────────────────────────────────────────────────────────────

export const HabitLogSchema = z.object({
  id: uuid,
  habit_id: uuid,
  log_date: localDate,
  completed_at: isoTimestamp,
  note: z.string().trim().max(280).nullable().default(null),
  created_at: isoTimestamp,
});

export type HabitLog = z.infer<typeof HabitLogSchema>;

// ───────────────────────────────────────────────────────────────
// Drafts (input del usuario — sin id ni timestamps de servidor)
// ───────────────────────────────────────────────────────────────

export const CreateHabitDraftSchema = z.object({
  name: trimmed(1, 100),
  description: z.string().trim().max(500).nullable().optional(),
  icon: z.string().trim().max(32).nullable().optional(),
  color: hexColor,
  frequency: HabitFrequencySchema,
  sort_order: z.number().int().optional(),
});

export type CreateHabitDraft = z.infer<typeof CreateHabitDraftSchema>;

export const UpdateHabitDraftSchema = CreateHabitDraftSchema.partial();
export type UpdateHabitDraft = z.infer<typeof UpdateHabitDraftSchema>;

export const CreateHabitLogDraftSchema = z.object({
  habit_id: uuid,
  log_date: localDate.optional(), // si falta, el store calcula "hoy" en local
  note: z.string().trim().max(280).nullable().optional(),
});

export type CreateHabitLogDraft = z.infer<typeof CreateHabitLogDraftSchema>;

// ───────────────────────────────────────────────────────────────
// Row schemas (espejo de SQLite) — lo que cruza la frontera Tauri
// ───────────────────────────────────────────────────────────────

export const FrequencyTypeSchema = z.enum(["daily", "weekly", "interval"]);

export const HabitRowSchema = z.object({
  id: uuid,
  name: z.string(),
  description: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string(),
  frequency_type: FrequencyTypeSchema,
  target_per_period: z.number().int(),
  interval_days: z.number().int().nullable(),
  days_of_week: z.string().nullable(), // JSON string o null
  sort_order: z.number().int(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().nullable(),
});

export type HabitRow = z.infer<typeof HabitRowSchema>;

export const HabitLogRowSchema = z.object({
  id: uuid,
  habit_id: uuid,
  log_date: z.string(),
  completed_at: z.string(),
  note: z.string().nullable(),
  created_at: z.string(),
});

export type HabitLogRow = z.infer<typeof HabitLogRowSchema>;

// ───────────────────────────────────────────────────────────────
// Mappers: row ⇄ dominio
// ───────────────────────────────────────────────────────────────

export function rowToHabit(row: HabitRow): Habit {
  const base = {
    target_per_period: row.target_per_period,
  };
  const frequency: HabitFrequency =
    row.frequency_type === "daily"
      ? { type: "daily", ...base }
      : row.frequency_type === "weekly"
        ? { type: "weekly", ...base }
        : {
            type: "interval",
            ...base,
            interval_days: row.interval_days ?? 1,
          };

  return HabitSchema.parse({
    id: row.id,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    frequency,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
    archived_at: row.archived_at,
  });
}

export function rowToHabitLog(row: HabitLogRow): HabitLog {
  return HabitLogSchema.parse(row);
}

/** Aplana un Habit (o draft) a la forma de fila que espera Rust/SQLite. */
export function habitToRow(h: CreateHabitDraft | UpdateHabitDraft | Habit) {
  const frequency: HabitFrequency | undefined = "frequency" in h ? h.frequency : undefined;

  const base = {
    name: h.name,
    description: h.description ?? null,
    icon: h.icon ?? null,
    color: h.color,
    sort_order: h.sort_order ?? 0,
  };

  if (!frequency) {
    return {
      ...base,
      frequency_type: "daily" as const,
      target_per_period: 1,
      interval_days: null,
      days_of_week: null,
    };
  }

  return {
    ...base,
    frequency_type: frequency.type,
    target_per_period: frequency.target_per_period,
    interval_days: frequency.type === "interval" ? frequency.interval_days : null,
    days_of_week: null,
  };
}
