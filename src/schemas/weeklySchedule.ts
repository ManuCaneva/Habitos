import { z } from "zod";
import { isoTimestamp, trimmed, uuid } from "./primitives";

// ── Paleta de colores (tokens del design system; NO hardcodear hex en componentes) ──
export const BLOCK_COLOR_TOKENS = [
  "lavender", "green", "yellow", "red", "pink", "cyan", "orange", "bone",
] as const;
export type BlockColorToken = (typeof BLOCK_COLOR_TOKENS)[number];
export const blockColorSchema = z.enum(BLOCK_COLOR_TOKENS);

// ── Dominio (consume Pinia/Vue) ──
export const ScheduleBlockSchema = z.object({
  id: uuid,
  day_of_week: z.number().int().min(0).max(6),
  start_minutes: z.number().int().min(0).max(1439),
  end_minutes: z.number().int().min(1).max(1440),
  title: trimmed(1, 80),
  color: blockColorSchema,
  sort_order: z.number().default(0),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
}).refine((b) => b.end_minutes > b.start_minutes, {
  message: "end_minutes debe ser mayor que start_minutes",
  path: ["end_minutes"],
});
export type ScheduleBlock = z.infer<typeof ScheduleBlockSchema>;

// ── Drafts (entrada para crear / actualizar) ──
const CreateScheduleBlockDraftObject = ScheduleBlockSchema.innerType().omit({
  id: true, created_at: true, updated_at: true,
});

export const CreateScheduleBlockDraftSchema = CreateScheduleBlockDraftObject.refine((b) => b.end_minutes > b.start_minutes, {
  message: "end_minutes debe ser mayor que start_minutes",
  path: ["end_minutes"],
});
export type CreateScheduleBlockDraft = z.infer<typeof CreateScheduleBlockDraftSchema>;

export const UpdateScheduleBlockDraftSchema = CreateScheduleBlockDraftObject.partial();
export type UpdateScheduleBlockDraft = z.infer<typeof UpdateScheduleBlockDraftSchema>;

// ── Row (espejo exacto de columnas SQLite; valida frontera Tauri) ──
export const ScheduleBlockRowSchema = z.object({
  id: uuid,
  day_of_week: z.number().int().min(0).max(6),
  start_minutes: z.number().int().min(0).max(1439),
  end_minutes: z.number().int().min(1).max(1440),
  title: z.string().min(1).max(80),
  color: z.string().min(1),
  sort_order: z.number(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
});
export type ScheduleBlockRow = z.infer<typeof ScheduleBlockRowSchema>;

// ── Mappers (única flatten/unflatten point) ──
const OLD_COLOR_MAP: Record<string, string> = {
  primary: "lavender",
  "primary-hover": "lavender",
  success: "green",
  "brand-secure": "cyan",
  "surface-4": "bone",
  canvas: "bone",
  overlay: "bone",
};

export function rowToScheduleBlock(row: ScheduleBlockRow): ScheduleBlock {
  const normColor = (row.color || "").trim().toLowerCase();
  let mappedColor = OLD_COLOR_MAP[normColor] || normColor;
  
  if (!BLOCK_COLOR_TOKENS.includes(mappedColor as any)) {
    mappedColor = "lavender";
  }

  return ScheduleBlockSchema.parse({
    id: row.id,
    day_of_week: row.day_of_week,
    start_minutes: row.start_minutes,
    end_minutes: row.end_minutes,
    title: row.title,
    color: mappedColor as BlockColorToken,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  });
}
export function scheduleBlockToRow(b: ScheduleBlock): ScheduleBlockRow {
  return ScheduleBlockRowSchema.parse({
    id: b.id,
    day_of_week: b.day_of_week,
    start_minutes: b.start_minutes,
    end_minutes: b.end_minutes,
    title: b.title,
    color: b.color,
    sort_order: b.sort_order,
    created_at: b.created_at,
    updated_at: b.updated_at,
  });
}

// ── Settings (persisten en config table, key weekly-schedule-settings) ──
export const WeeklyScheduleSettingsSchema = z.object({
  granularity_minutes: z.union([z.literal(15), z.literal(30), z.literal(60)]).default(30),
  day_start_minutes: z.number().int().min(0).max(1439).default(360),   // 06:00
  day_end_minutes: z.number().int().min(60).max(1440).default(1380),    // 23:00
  week_starts_monday: z.boolean().default(true),                        // MVP fijo true (sin UI)
});
export type WeeklyScheduleSettings = z.infer<typeof WeeklyScheduleSettingsSchema>;
export const DEFAULT_WEEKLY_SCHEDULE_SETTINGS: WeeklyScheduleSettings =
  WeeklyScheduleSettingsSchema.parse({});
