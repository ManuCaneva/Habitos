import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as db from '../lib/db'
import {
  type CreateScheduleBlockDraft,
  type CreateScheduleSlotDraft,
  type ScheduleBlock,
  type ScheduleBlockWithSlots,
  type ScheduleSlot,
  type UpdateScheduleBlockDraft,
  type WeeklyScheduleSettings,
  DEFAULT_WEEKLY_SCHEDULE_SETTINGS,
  rowToScheduleBlock,
  rowToScheduleSlot,
} from '../schemas/weeklySchedule'

function nowIsoUtc(): string {
  return new Date().toISOString()
}
function uuidv4(): string {
  return crypto.randomUUID()
}

export function minutesToHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
export function hhmmToMinutes(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s)
  if (!m) throw new Error(`HH:MM inválido: ${s}`)
  const h = Number(m[1])
  const mm = Number(m[2])
  if (h < 0 || h > 23 || mm < 0 || mm > 59) throw new Error(`HH:MM fuera de rango: ${s}`)
  return h * 60 + mm
}

export function snapToSlot(minutes: number, granularity: number): number {
  return Math.max(0, Math.floor(minutes / granularity) * granularity)
}

export function overlaps(
  a: { start_minutes: number; end_minutes: number },
  b: { start_minutes: number; end_minutes: number }
): boolean {
  return a.start_minutes < b.end_minutes && b.start_minutes < a.end_minutes
}

export type ValidationResult =
  { ok: true } | { ok: false; reason: 'overlap'; day: number; start: number; end: number }

export const DEFAULT_VISIBLE_WINDOW = { start_minutes: 360, end_minutes: 1380 } as const
export type VisibleWindow = { start_minutes: number; end_minutes: number }

export function computeVisibleWindow(
  blocksWithSlots: Pick<ScheduleBlockWithSlots, 'slots'>[]
): VisibleWindow {
  let minStart: number | null = null
  let maxEnd: number | null = null
  for (const bw of blocksWithSlots) {
    for (const slot of bw.slots) {
      if (minStart === null || slot.start_minutes < minStart) minStart = slot.start_minutes
      if (maxEnd === null || slot.end_minutes > maxEnd) maxEnd = slot.end_minutes
    }
  }
  if (minStart === null || maxEnd === null) {
    return { ...DEFAULT_VISIBLE_WINDOW }
  }
  return {
    start_minutes: Math.floor(minStart / 60) * 60,
    end_minutes: Math.ceil(maxEnd / 60) * 60,
  }
}

export const useWeeklyScheduleStore = defineStore('weeklySchedule', () => {
  const blocksWithSlots = ref<ScheduleBlockWithSlots[]>([])
  const settings = ref<WeeklyScheduleSettings>({ ...DEFAULT_WEEKLY_SCHEDULE_SETTINGS })
  const loading = ref(false)
  const lastError = ref<string | null>(null)

  const blocksByDay = computed(() => {
    const map = new Map<number, ScheduleSlot[]>()
    for (let d = 0; d < 7; d++) map.set(d, [])
    for (const bw of blocksWithSlots.value) {
      for (const slot of bw.slots) {
        const list = map.get(slot.day_of_week)
        if (list) {
          list.push(slot)
        }
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_minutes - b.start_minutes)
    }
    return map
  })

  const visibleWindow = computed(() => computeVisibleWindow(blocksWithSlots.value))

  function wouldOverlapOnDay(
    day: number,
    start: number,
    end: number,
    ignoreSlotId?: string
  ): boolean {
    const list = blocksByDay.value.get(day) ?? []
    return list.some(
      (s) =>
        (ignoreSlotId === undefined || s.id !== ignoreSlotId) &&
        overlaps(s, { start_minutes: start, end_minutes: end })
    )
  }

  function validateSlot(
    draft: { day_of_week: number; start_minutes: number; end_minutes: number },
    ignoreSlotId?: string
  ): ValidationResult {
    if (wouldOverlapOnDay(draft.day_of_week, draft.start_minutes, draft.end_minutes, ignoreSlotId))
      return {
        ok: false,
        reason: 'overlap',
        day: draft.day_of_week,
        start: draft.start_minutes,
        end: draft.end_minutes,
      }
    return { ok: true }
  }

  async function loadAll() {
    loading.value = true
    lastError.value = null
    try {
      const [blockRows, slotRows] = await Promise.all([
        db.listScheduleBlocks(),
        db.listScheduleSlots(),
      ])
      const blocksMap = new Map<string, ScheduleBlock>()
      for (const r of blockRows) {
        blocksMap.set(r.id, rowToScheduleBlock(r))
      }
      const slotsByBlock = new Map<string, ScheduleSlot[]>()
      for (const r of slotRows) {
        const slot = rowToScheduleSlot(r)
        const list = slotsByBlock.get(slot.block_id) ?? []
        list.push(slot)
        slotsByBlock.set(slot.block_id, list)
      }
      blocksWithSlots.value = blockRows.map((r) => {
        const block = rowToScheduleBlock(r)
        return { ...block, slots: slotsByBlock.get(block.id) ?? [] }
      })
      settings.value = await db.loadWeeklyScheduleSettings()
    } catch (e) {
      console.error('WeeklySchedule loadAll failed:', e)
      lastError.value = String(e)
    } finally {
      loading.value = false
    }
  }

  async function createBlock(
    draft: CreateScheduleBlockDraft,
    slots: CreateScheduleSlotDraft[]
  ): Promise<ScheduleBlockWithSlots> {
    for (const s of slots) {
      const v = validateSlot(s)
      if (!v.ok) throw new Error('Un slot se solapa con otro existente en ese día')
    }
    const blockId = uuidv4()
    const ts = nowIsoUtc()
    const blockRow = await db.createScheduleBlock(draft, blockId, ts, ts)
    const block = rowToScheduleBlock(blockRow)
    const createdSlots: ScheduleSlot[] = []
    for (const s of slots) {
      const slotId = uuidv4()
      const slotRow = await db.createScheduleSlot(s, slotId, blockId, ts, ts)
      createdSlots.push(rowToScheduleSlot(slotRow))
    }
    const bw: ScheduleBlockWithSlots = { ...block, slots: createdSlots }
    blocksWithSlots.value = [...blocksWithSlots.value, bw]
    return bw
  }

  async function updateBlock(id: string, patch: UpdateScheduleBlockDraft): Promise<void> {
    const existing = blocksWithSlots.value.find((bw) => bw.id === id)
    if (!existing) throw new Error('Bloque no encontrado')
    const ts = nowIsoUtc()
    const row = await db.updateScheduleBlock(id, patch, ts)
    const updated = rowToScheduleBlock(row)
    blocksWithSlots.value = blocksWithSlots.value.map((bw) =>
      bw.id === id ? { ...updated, slots: bw.slots } : bw
    )
  }

  async function addSlot(blockId: string, draft: CreateScheduleSlotDraft): Promise<ScheduleSlot> {
    const v = validateSlot(draft)
    if (!v.ok) throw new Error('El slot se solapa con otro existente en ese día')
    const existing = blocksWithSlots.value.find((bw) => bw.id === blockId)
    if (!existing) throw new Error('Bloque no encontrado')
    const slotId = uuidv4()
    const ts = nowIsoUtc()
    const slotRow = await db.createScheduleSlot(draft, slotId, blockId, ts, ts)
    const slot = rowToScheduleSlot(slotRow)
    blocksWithSlots.value = blocksWithSlots.value.map((bw) =>
      bw.id === blockId ? { ...bw, slots: [...bw.slots, slot] } : bw
    )
    return slot
  }

  async function updateSlot(
    slotId: string,
    patch: {
      day_of_week?: number
      start_minutes?: number
      end_minutes?: number
    }
  ): Promise<void> {
    const bw = blocksWithSlots.value.find((b) => b.slots.some((s) => s.id === slotId))
    if (!bw) throw new Error('Slot no encontrado')
    const existingSlot = bw.slots.find((s) => s.id === slotId)!
    const merged = { ...existingSlot, ...patch }
    const v = validateSlot(merged, slotId)
    if (!v.ok) throw new Error('El slot se solapa con otro existente en ese día')
    const ts = nowIsoUtc()
    const row = await db.updateScheduleSlot(slotId, patch, ts)
    const updated = rowToScheduleSlot(row)
    blocksWithSlots.value = blocksWithSlots.value.map((b) =>
      b.id === bw.id ? { ...b, slots: b.slots.map((s) => (s.id === slotId ? updated : s)) } : b
    )
  }

  async function deleteSlot(slotId: string): Promise<void> {
    await db.deleteScheduleSlot(slotId)
    blocksWithSlots.value = blocksWithSlots.value.map((bw) =>
      bw.id === bw.slots.find((s) => s.id === slotId)?.block_id
        ? { ...bw, slots: bw.slots.filter((s) => s.id !== slotId) }
        : bw
    )
  }

  async function deleteBlock(id: string): Promise<void> {
    await db.deleteScheduleBlock(id)
    blocksWithSlots.value = blocksWithSlots.value.filter((bw) => bw.id !== id)
  }

  async function saveSettings(patch: Partial<WeeklyScheduleSettings>): Promise<void> {
    settings.value = { ...settings.value, ...patch }
    await db.saveWeeklyScheduleSettings(settings.value)
  }

  return {
    blocksWithSlots,
    settings,
    loading,
    lastError,
    blocksByDay,
    visibleWindow,
    wouldOverlapOnDay,
    validateSlot,
    loadAll,
    createBlock,
    updateBlock,
    deleteBlock,
    addSlot,
    updateSlot,
    deleteSlot,
    saveSettings,
  }
})
