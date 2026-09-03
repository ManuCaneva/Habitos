import { z } from 'zod'
import { isoTimestamp, trimmed, uuid } from './primitives'

// ── Paleta de colores (tokens del design system; NO hardcodear hex en componentes) ──
export const BLOCK_COLOR_TOKENS = [
  'lavender',
  'green',
  'yellow',
  'red',
  'pink',
  'cyan',
  'orange',
  'bone',
] as const
export type BlockColorToken = (typeof BLOCK_COLOR_TOKENS)[number]
export const blockColorSchema = z.enum(BLOCK_COLOR_TOKENS)

// ── Dominio (consume Pinia/Vue) ──
export const ScheduleBlockSchema = z.object({
  id: uuid,
  title: trimmed(1, 80),
  color: blockColorSchema,
  sort_order: z.number().default(0),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
})
export type ScheduleBlock = z.infer<typeof ScheduleBlockSchema>

// ── Slots (horarios específicos de un bloque) ──
const ScheduleSlotObject = z.object({
  id: uuid,
  block_id: uuid,
  day_of_week: z.number().int().min(0).max(6),
  start_minutes: z.number().int().min(0).max(1439),
  end_minutes: z.number().int().min(1).max(1440),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
})

export const ScheduleSlotSchema = ScheduleSlotObject.refine(
  (s) => s.end_minutes > s.start_minutes,
  {
    message: 'end_minutes debe ser mayor que start_minutes',
    path: ['end_minutes'],
  }
)
export type ScheduleSlot = z.infer<typeof ScheduleSlotSchema>

// ── Bloque con sus slots (para consumo en UI) ──
export const ScheduleBlockWithSlotsSchema = ScheduleBlockSchema.extend({
  slots: z.array(ScheduleSlotSchema),
})
export type ScheduleBlockWithSlots = z.infer<typeof ScheduleBlockWithSlotsSchema>

// ── Drafts (entrada para crear / actualizar) ──
export const CreateScheduleBlockDraftSchema = ScheduleBlockSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
})
export type CreateScheduleBlockDraft = z.infer<typeof CreateScheduleBlockDraftSchema>

export const UpdateScheduleBlockDraftSchema = CreateScheduleBlockDraftSchema.partial()
export type UpdateScheduleBlockDraft = z.infer<typeof UpdateScheduleBlockDraftSchema>

// ── Slot drafts ──
export const CreateScheduleSlotDraftSchema = ScheduleSlotObject.omit({
  id: true,
  block_id: true,
  created_at: true,
  updated_at: true,
}).refine((s) => s.end_minutes > s.start_minutes, {
  message: 'end_minutes debe ser mayor que start_minutes',
  path: ['end_minutes'],
})
export type CreateScheduleSlotDraft = z.infer<typeof CreateScheduleSlotDraftSchema>

// ── Row (espejo exacto de columnas SQLite; valida frontera Tauri) ──
export const ScheduleBlockRowSchema = z.object({
  id: uuid,
  title: z.string().min(1).max(80),
  color: z.string().min(1),
  sort_order: z.number(),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
})
export type ScheduleBlockRow = z.infer<typeof ScheduleBlockRowSchema>

export const ScheduleSlotRowSchema = z.object({
  id: uuid,
  block_id: uuid,
  day_of_week: z.number().int().min(0).max(6),
  start_minutes: z.number().int().min(0).max(1439),
  end_minutes: z.number().int().min(1).max(1440),
  created_at: isoTimestamp,
  updated_at: isoTimestamp,
})
export type ScheduleSlotRow = z.infer<typeof ScheduleSlotRowSchema>

// ── Mappers (única flatten/unflatten point) ──
const OLD_COLOR_MAP: Record<string, string> = {
  primary: 'lavender',
  'primary-hover': 'lavender',
  success: 'green',
  'brand-secure': 'cyan',
  'surface-4': 'bone',
  canvas: 'bone',
  overlay: 'bone',
}

export function rowToScheduleBlock(row: ScheduleBlockRow): ScheduleBlock {
  const normColor = (row.color || '').trim().toLowerCase()
  let mappedColor = OLD_COLOR_MAP[normColor] || normColor

  if (!BLOCK_COLOR_TOKENS.includes(mappedColor as BlockColorToken)) {
    mappedColor = 'lavender'
  }

  return ScheduleBlockSchema.parse({
    id: row.id,
    title: row.title,
    color: mappedColor as BlockColorToken,
    sort_order: row.sort_order,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })
}
export function scheduleBlockToRow(b: ScheduleBlock): ScheduleBlockRow {
  return ScheduleBlockRowSchema.parse({
    id: b.id,
    title: b.title,
    color: b.color,
    sort_order: b.sort_order,
    created_at: b.created_at,
    updated_at: b.updated_at,
  })
}

export function rowToScheduleSlot(row: ScheduleSlotRow): ScheduleSlot {
  return ScheduleSlotSchema.parse({
    id: row.id,
    block_id: row.block_id,
    day_of_week: row.day_of_week,
    start_minutes: row.start_minutes,
    end_minutes: row.end_minutes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  })
}
export function scheduleSlotToRow(s: ScheduleSlot): ScheduleSlotRow {
  return ScheduleSlotRowSchema.parse({
    id: s.id,
    block_id: s.block_id,
    day_of_week: s.day_of_week,
    start_minutes: s.start_minutes,
    end_minutes: s.end_minutes,
    created_at: s.created_at,
    updated_at: s.updated_at,
  })
}

// ── Settings (persisten en config table, key weekly-schedule-settings) ──
// Nota: la Ventana visible es derivada (getter del store), nunca se persiste.
export const WeeklyScheduleSettingsSchema = z.object({
  granularity_minutes: z.union([z.literal(15), z.literal(30), z.literal(60)]).default(30),
  week_starts_monday: z.boolean().default(true), // MVP fijo true (sin UI)
})
export type WeeklyScheduleSettings = z.infer<typeof WeeklyScheduleSettingsSchema>
export const DEFAULT_WEEKLY_SCHEDULE_SETTINGS: WeeklyScheduleSettings =
  WeeklyScheduleSettingsSchema.parse({})
