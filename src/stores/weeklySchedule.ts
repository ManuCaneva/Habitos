import { defineStore } from "pinia";
import { computed, ref } from "vue";
import * as db from "../lib/db";
import {
  type CreateScheduleBlockDraft, type ScheduleBlock, type UpdateScheduleBlockDraft,
  type WeeklyScheduleSettings, DEFAULT_WEEKLY_SCHEDULE_SETTINGS,
  rowToScheduleBlock,
} from "../schemas/weeklySchedule";

// ── helpers (TS puro — no se delega a Rust ni SQL) ──
function nowIsoUtc(): string { return new Date().toISOString(); }
function uuidv4(): string { return crypto.randomUUID(); }

// Conversión minutos ↔ "HH:MM"
export function minutesToHHMM(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
export function hhmmToMinutes(s: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) throw new Error(`HH:MM inválido: ${s}`);
  const h = Number(m[1]); const mm = Number(m[2]);
  if (h < 0 || h > 23 || mm < 0 || mm > 59) throw new Error(`HH:MM fuera de rango: ${s}`);
  return h * 60 + mm;
}

// Snap a granularidad (redondeo hacia abajo)
export function snapToSlot(minutes: number, granularity: number): number {
  return Math.max(0, Math.floor(minutes / granularity) * granularity);
}

// Overlap entre dos bloques del mismo día
export function overlaps(a: { start_minutes: number; end_minutes: number },
                         b: { start_minutes: number; end_minutes: number }): boolean {
  return a.start_minutes < b.end_minutes && b.start_minutes < a.end_minutes;
}

// Resultado validación de bloque (antes de persistir)
export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: "overlap"; day: number; start: number; end: number };

// ── Store ──
export const useWeeklyScheduleStore = defineStore("weeklySchedule", () => {
  const blocks = ref<ScheduleBlock[]>([]);
  const settings = ref<WeeklyScheduleSettings>({ ...DEFAULT_WEEKLY_SCHEDULE_SETTINGS });
  const loading = ref(false);
  const lastError = ref<string | null>(null);

  // Getter: bloques por día (0..6), ordenados por start
  const blocksByDay = computed(() => {
    const map = new Map<number, ScheduleBlock[]>();
    for (let d = 0; d < 7; d++) map.set(d, []);
    for (const b of blocks.value) {
      const list = map.get(b.day_of_week);
      if (list) {
        list.push(b);
      }
    }
    for (const list of map.values()) {
      list.sort((a, b) => a.start_minutes - b.start_minutes);
    }
    return map;
  });

  // Validación: ¿solaparían en day con [start, end) si ignoramos ignoreId?
  function wouldOverlapOnDay(day: number, start: number, end: number,
                              ignoreId?: string): boolean {
    const list = blocksByDay.value.get(day) ?? [];
    return list.some((b) =>
      (ignoreId === undefined || b.id !== ignoreId) &&
      overlaps(b, { start_minutes: start, end_minutes: end }),
    );
  }

  function validateBlock(draft: { day_of_week: number; start_minutes: number;
                                   end_minutes: number }, ignoreId?: string): ValidationResult {
    if (wouldOverlapOnDay(draft.day_of_week, draft.start_minutes, draft.end_minutes, ignoreId))
      return { ok: false, reason: "overlap", day: draft.day_of_week,
               start: draft.start_minutes, end: draft.end_minutes };
    return { ok: true };
  }

  // Acciones de persistencia (tocan I/O)
  async function loadAll() {
    loading.value = true; lastError.value = null;
    try {
      const rows = await db.listScheduleBlocks();
      blocks.value = rows.map(rowToScheduleBlock);
      settings.value = await db.loadWeeklyScheduleSettings();
    } catch (e) {
      console.error("WeeklySchedule loadAll failed:", e);
      lastError.value = String(e);
    }
    finally { loading.value = false; }
  }

  async function createBlock(draft: CreateScheduleBlockDraft): Promise<ScheduleBlock> {
    const v = validateBlock(draft);
    if (!v.ok) throw new Error("El bloque se solapa con otro existente en ese día");
    const id = uuidv4(); const ts = nowIsoUtc();
    const row = await db.createScheduleBlock(draft, id, ts, ts);
    const block = rowToScheduleBlock(row);
    blocks.value = [...blocks.value, block];
    return block;
  }

  async function updateBlock(id: string, patch: UpdateScheduleBlockDraft): Promise<void> {
    const existing = blocks.value.find((b) => b.id === id);
    if (!existing) throw new Error("Bloque no encontrado");
    const merged = { ...existing, ...patch } as ScheduleBlock;
    const v = validateBlock(merged, id);
    if (!v.ok) throw new Error("El bloque se solapa con otro existente en ese día");
    const ts = nowIsoUtc();
    const row = await db.updateScheduleBlock(id, patch, ts);
    const updated = rowToScheduleBlock(row);
    blocks.value = blocks.value.map((b) => (b.id === id ? updated : b));
  }

  async function deleteBlock(id: string): Promise<void> {
    await db.deleteScheduleBlock(id);
    blocks.value = blocks.value.filter((b) => b.id !== id);
  }

  // Mover tras DnD: actualiza day + start + end preservando duración
  async function moveBlockAfterDrag(id: string, day: number,
                                     start_minutes: number, end_minutes: number): Promise<void> {
    const existing = blocks.value.find((b) => b.id === id);
    if (!existing) return;
    const candidate = { ...existing, day_of_week: day, start_minutes, end_minutes };
    const v = validateBlock(candidate, id);
    if (!v.ok) throw new Error("overlap");
    const ts = nowIsoUtc();
    const row = await db.updateScheduleBlock(id,
      { day_of_week: day, start_minutes, end_minutes }, ts);
    const updated = rowToScheduleBlock(row);
    blocks.value = blocks.value.map((b) => (b.id === id ? updated : b));
  }

  async function saveSettings(patch: Partial<WeeklyScheduleSettings>): Promise<void> {
    settings.value = { ...settings.value, ...patch };
    await db.saveWeeklyScheduleSettings(settings.value);
  }

  return {
    blocks, settings, loading, lastError,
    blocksByDay, wouldOverlapOnDay, validateBlock,
    loadAll, createBlock, updateBlock, deleteBlock, moveBlockAfterDrag, saveSettings,
  };
});
