# Spec: Widget Cronograma Semanal

**Fecha**: 2026-07-12
**Estado**: Borrador (pendiente de revisión del usuario)
**Feature source**: `docs/IDEAS.md` (Widget: Cronograma semanal)
**Stack**: Tauri 2 + Vue 3.5 + TypeScript + Pinia + Zod + Tailwind 3.4 + interactjs (ya instalado)

---

## 1. Objetivo

Agregar un widget de dashboard **Cronograma Semanal** dentro de un contenedor abstracto (mismo patrón que `HabitsWidget` / `YearCalendarWidget`). El widget muestra una grilla **días × horarios** (Lunes → Domingo) con **bloques arrastrables** que se ajustan a una grilla de tiempo (snap). Es una **plantilla semanal recurrente**: los bloques se repiten igual cada semana (no están atados a una fecha concreta, solo al día de la semana). El usuario puede crear, mover, editar y eliminar bloques; configurar granularidad y rango horario desde el propio widget; todo persistido en SQLite.

Principio rector (`AGENTS.md` "regla de oro"): **toda la lógica de negocio vive en TypeScript** (snap, validación de overlaps, conversión píxel↔minuto, generación de IDs/timestamps). **Rust es solo I/O** (CRUD plano sobre `schedule_blocks`).

## 2. Scope

### Dentro
- Widget de dashboard **"Cronograma Semanal"** registrado en `dashboardWidgets.ts` (picker/remove/drag-resize del dashboard funciona gratis).
- Contenedor abstracto (`Container.vue` + header propio con título **"Cronograma Semanal"** + botón `+` para crear bloque + botón ajustes ⚙).
- Grilla 7 columnas (Lun→Dom) × filas de horas navegables verticalmente.
- Bloques con: **título + color (paleta fija de tokens) + día + start_minutes + end_minutes**.
- **Drag-and-drop con snap a grilla** (mover bloques entre columnas y horarios; cambio de día a cualquiera de las 7 columnas; rechazo con feedback si solapa).
- Plantilla recurrente: cada bloque atado a `day_of_week` (0..6, 0=Lunes). No hay fecha concreta.
- Crear bloque por botón `+` (abre modal).
- Editar/eliminar bloque por click (abre modal).
- Modal de **ajustes del widget** dentro del header: granularidad (15/30/60 min), rango horario (start/end HH:MM).
- Validación de **no solapamiento** dentro del mismo día (TS, antes de persistir).
- Persistencia en nueva tabla `schedule_blocks` (migración 005) + comandos Rust delgados; settings persisten en tabla `config` existente.
- Tests TDD por archivo `.ts`/`.vue` con `.test.ts` al lado.

### Fuera (no se hace en esta feature)
- Overlay de hábitos / tareas / objetivos / Google Calendar sobre la grilla.
- Resize de bloques arrastrando bordes (cambio de duración solo vía modal).
- Día de inicio de semana configurable en UI (se hardcodea Lunes=0; `week_starts_monday` queda en schema, sin UI por ahora).
- Notificaciones ("X en 10 min").
- Plantillas múltiples (un solo cronograma).
- Atados a fecha concreta / agenda diaria.
- Color libre (hex picker).
- Drag multi-selección.

## 3. Decisiones acordadas

| Decisión | Valor | Razón |
|---|---|---|
| Origen de bloques | Entidad nueva persistida en SQLite | Máxima flexibilidad, independiente de hábitos |
| Recurrencia | Plantilla semanal (día de la semana, sin fecha) | "Cronograma Semanal" = plantilla tipo |
| DnD | Snap a grilla (sin resize por borde) | Limpio y predecible, coherente con "lindo y simple" |
| Granularidad / rango | Configurable por usuario en header del widget | Personalizable sin salir del widget |
| Modelo de bloque | título + color + día + start_minutes + end_minutes | Mínimo útil |
| Semana | Lunes a domingo, sin solapamientos | ISO, en español; validación en TS |
| Edición | Drag para mover + Modal al click | Coherente con el resto de la app (Modales existentes) |
| Crear bloque | Botón `+` en el header del widget | Explícito, sin ambigüedad |
| Cambio de duración | Solo vía modal (campos start/end) | Simplicidad |
| Color | Paleta fija de tokens del design system | Consistencia, cumple `AGENTS.md` (no hardcodear hex) |
| Settings del widget | Dentro del header (mini-modal ⚙) | Autocontenido |
| Cambio de día al arrastrar | Cualquier columna; rechazar si overlap | Máxima flexibilidad dentro de la validación |
| Persistencia | Nueva tabla `schedule_blocks` + migración 005 + comando Rust | Sigue patrón `habits` (schema doble dominio/row + mapper) |
| Settings (granularidad/rango) | Tabla `config` existente, key `weekly-schedule-settings` | Sin migración extra; igual que layout del dashboard |
| DnD lib | `interactjs` (ya instalado `package.json:22`) | Reutilizar, sin nueva dependencia |
| Edit mode | Drag solo activo si `ui.editMode === true` | Coherente con dashboard (los widgets se editan en editMode) |
| Mappeo día número | 0=Lunes, 1=Martes, ..., 6=Domingo | ISO 8601, coincide con "lunes a domingo" |

## 4. Arquitectura por capas

Cumple `docs/ARCHITECTURE.md`: Rust es solo I/O; toda la lógica vive en TS.

```
Vue (lógica + UI)
  stores/weeklySchedule.ts         ← orquestación + lógica de dominio (overlap, snap, validate)
  schemas/weeklySchedule.ts        ← Zod: dominio + row + drafts + mappers + settings
  lib/db.ts                        ← exports ScheduleBlock* (frontera Tauri, validación Zod)
  composables/useScheduleDrag.ts   ← wrapper interactjs: draggable + snap + conversión px↔min
  components/dashboard/
    WeeklyScheduleWidget.vue       ← Container + header (título + ⚙ + +)
    WeeklyScheduleGrid.vue         ← grilla días×horarios, etiquetas, bloques absolutos
    WeeklyScheduleBlock.vue        ← un bloque draggable, click → emit edit
    WeeklyScheduleModal.vue        ← Modal crear/editar (título, color, día, start, end, eliminar)
    WeeklyScheduleSettingsModal.vue ← Modal ajustes (granularidad, rango)
    ↓ invoke (Tauri)
Rust (solo I/O)
  commands/weekly_schedule.rs      ← list/create/update/delete/upsert_all (sigue habits.rs)
  lib.rs: registra 5 comandos en generate_handler!
  db/mod.rs: corre migración 005
SQLite
  schedule_blocks (migration 005)  ← bloques (plantilla recurrente)
  config (migration 002 existente) ← settings del widget (key weekly-schedule-settings)
```

**Consecuencia**: el lado Rust recibe **5 comandos nuevos delgados** (CRUD + batch upsert). Validación de overlap y snap viven en TS.

## 5. Dependencias nuevas

**Ninguna.** `interactjs` ya está en `package.json`. No se agregan crates ni paquetes JS nuevos.

## 6. Archivos nuevos / modificados

| Archivo | Acción |
|---|---|
| `src-tauri/src/db/migrations/005_weekly_schedule.sql` | nueva — crea tabla `schedule_blocks` |
| `src-tauri/src/db/mod.rs` | modificar — incluye migración 005 |
| `src-tauri/src/commands/weekly_schedule.rs` | nueva — 5 comandos delgados |
| `src-tauri/src/commands/mod.rs` | modificar — `pub mod weekly_schedule;` |
| `src-tauri/src/lib.rs` | modificar — agrega 5 handlers en `generate_handler!` |
| `src/schemas/weeklySchedule.ts` (+`.test.ts`) | nueva — Zod dominio+row+drafts+mappers+settings |
| `src/stores/weeklySchedule.ts` (+`.test.ts`) | nueva — Pinia store + lógica de dominio |
| `src/lib/db.ts` | modificar — exports `*ScheduleBlock*` + `load/saveWeeklyScheduleSettings` |
| `src/composables/useScheduleDrag.ts` | nueva — wrapper interactjs |
| `src/components/dashboard/WeeklyScheduleWidget.vue` (+`.test.ts`) | nueva — widget con header |
| `src/components/dashboard/WeeklyScheduleGrid.vue` (+`.test.ts`) | nueva — grilla |
| `src/components/dashboard/WeeklyScheduleBlock.vue` (+`.test.ts`) | nueva — bloque draggable |
| `src/components/dashboard/WeeklyScheduleModal.vue` (+`.test.ts`) | nueva — modal crear/editar |
| `src/components/dashboard/WeeklyScheduleSettingsModal.vue` (+`.test.ts`) | nueva — modal ajustes |
| `src/lib/dashboardWidgets.ts` | modificar — registra `"weekly-schedule"` |
| `docs/IDEAS.md` | modificar — marcar widget como implementado |

## 7. Modelo de datos

### 7.1 Migration `005_weekly_schedule.sql`

```sql
-- schedule_blocks: bloques de la plantilla semanal recurrente.
-- day_of_week: 0=Lunes .. 6=Domingo (ISO 8601, lun-comienzo).
-- start_minutes / end_minutes: minutos desde medianoche local (0..1440).

CREATE TABLE IF NOT EXISTS schedule_blocks (
  id            TEXT PRIMARY KEY,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_minutes INTEGER NOT NULL CHECK (start_minutes >= 0 AND start_minutes < 1440),
  end_minutes   INTEGER NOT NULL CHECK (end_minutes > 0 AND end_minutes <= 1440),
  title         TEXT NOT NULL,
  color         TEXT NOT NULL,
  sort_order    REAL NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  CHECK (end_minutes > start_minutes)
);

CREATE INDEX IF NOT EXISTS idx_schedule_blocks_day ON schedule_blocks(day_of_week);
```

### 7.2 `src/schemas/weeklySchedule.ts`

```ts
import { z } from "zod";
import { isoTimestamp, trimmed, uuid } from "./primitives";

// ── Paleta de colores (tokens del design system; NO hardcodear hex en componentes) ──
export const BLOCK_COLOR_TOKENS = [
  "primary", "primary-hover", "success", "brand-secure",
  "surface-4", "canvas", "overlay",
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
export const CreateScheduleBlockDraftSchema = ScheduleBlockSchema.omit({
  id: true, created_at: true, updated_at: true,
});
export type CreateScheduleBlockDraft = z.infer<typeof CreateScheduleBlockDraftSchema>;

export const UpdateScheduleBlockDraftSchema = CreateScheduleBlockDraftSchema.partial();
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
export function rowToScheduleBlock(row: ScheduleBlockRow): ScheduleBlock {
  return ScheduleBlockSchema.parse({
    id: row.id,
    day_of_week: row.day_of_week,
    start_minutes: row.start_minutes,
    end_minutes: row.end_minutes,
    title: row.title,
    color: row.color as BlockColorToken,
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
```

### 7.3 `src-tauri/src/commands/weekly_schedule.rs`

```rust
use crate::db::{Db, DbError, DbResult, IntoStringErr};
use rusqlite::{params, OptionalExtension};
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateScheduleBlockInput {
    pub id: String,
    pub day_of_week: i32,
    pub start_minutes: i32,
    pub end_minutes: i32,
    pub title: String,
    pub color: String,
    #[serde(default)]
    pub sort_order: f64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateScheduleBlockInput {
    pub id: String,
    pub day_of_week: Option<i32>,
    pub start_minutes: Option<i32>,
    pub end_minutes: Option<i32>,
    pub title: Option<String>,
    pub color: Option<String>,
    pub sort_order: Option<f64>,
    pub updated_at: String,
}

#[derive(Debug, Serialize)]
pub struct ScheduleBlockRow {
    pub id: String,
    pub day_of_week: i32,
    pub start_minutes: i32,
    pub end_minutes: i32,
    pub title: String,
    pub color: String,
    pub sort_order: f64,
    pub created_at: String,
    pub updated_at: String,
}

fn row_to_block(r: &rusqlite::Row<'_>) -> rusqlite::Result<ScheduleBlockRow> {
    Ok(ScheduleBlockRow {
        id: r.get("id")?,
        day_of_week: r.get("day_of_week")?,
        start_minutes: r.get("start_minutes")?,
        end_minutes: r.get("end_minutes")?,
        title: r.get("title")?,
        color: r.get("color")?,
        sort_order: r.get("sort_order")?,
        created_at: r.get("created_at")?,
        updated_at: r.get("updated_at")?,
    })
}

#[tauri::command]
pub fn list_schedule_blocks(db: State<'_, Db>) -> Result<Vec<ScheduleBlockRow>, String> {
    let result: DbResult<Vec<ScheduleBlockRow>> = (|| {
        let conn = db.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, day_of_week, start_minutes, end_minutes, title, color,
                    sort_order, created_at, updated_at
             FROM schedule_blocks ORDER BY day_of_week ASC, start_minutes ASC",
        )?;
        let rows = stmt.query_map([], row_to_block)?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn create_schedule_block(
    db: State<'_, Db>,
    input: CreateScheduleBlockInput,
) -> Result<ScheduleBlockRow, String> {
    let result: DbResult<ScheduleBlockRow> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO schedule_blocks
               (id, day_of_week, start_minutes, end_minutes, title, color,
                sort_order, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                input.id, input.day_of_week, input.start_minutes,
                input.end_minutes, input.title, input.color,
                input.sort_order, input.created_at, input.updated_at,
            ],
        )?;
        let row = conn
            .query_row(
                "SELECT * FROM schedule_blocks WHERE id = ?1",
                params![input.id],
                row_to_block,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn update_schedule_block(
    db: State<'_, Db>,
    input: UpdateScheduleBlockInput,
) -> Result<ScheduleBlockRow, String> {
    let result: DbResult<ScheduleBlockRow> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute(
            "UPDATE schedule_blocks SET
               day_of_week  = COALESCE(?2, day_of_week),
               start_minutes = COALESCE(?3, start_minutes),
               end_minutes  = COALESCE(?4, end_minutes),
               title        = COALESCE(?5, title),
               color        = COALESCE(?6, color),
               sort_order   = COALESCE(?7, sort_order),
               updated_at   = ?8
             WHERE id = ?1",
            params![
                input.id, input.day_of_week, input.start_minutes,
                input.end_minutes, input.title, input.color,
                input.sort_order, input.updated_at,
            ],
        )?;
        let row = conn
            .query_row(
                "SELECT * FROM schedule_blocks WHERE id = ?1",
                params![input.id],
                row_to_block,
            )
            .optional()?
            .ok_or(DbError::NotFound)?;
        Ok(row)
    })();
    result.to_str_err()
}

#[tauri::command]
pub fn delete_schedule_block(db: State<'_, Db>, id: String) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        conn.execute("DELETE FROM schedule_blocks WHERE id = ?1", params![id])?;
        Ok(())
    })();
    result.to_str_err()
}

// Batch upsert: reemplaza todos los bloques (usado tras DnD masivo / reset).
#[tauri::command]
pub fn upsert_all_schedule_blocks(
    db: State<'_, Db>,
    blocks: Vec<ScheduleBlockRow>,
) -> Result<(), String> {
    let result: DbResult<()> = (|| {
        let conn = db.conn.lock().unwrap();
        let tx = conn.unchecked_transaction()?;
        tx.execute("DELETE FROM schedule_blocks", [])?;
        for b in blocks {
            tx.execute(
                "INSERT INTO schedule_blocks
                   (id, day_of_week, start_minutes, end_minutes, title, color,
                    sort_order, created_at, updated_at)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    b.id, b.day_of_week, b.start_minutes, b.end_minutes,
                    b.title, b.color, b.sort_order, b.created_at, b.updated_at,
                ],
            )?;
        }
        tx.commit()?;
        Ok(())
    })();
    result.to_str_err()
}
```

### 7.4 Registro en `src-tauri/src/lib.rs`

Dentro de `tauri::generate_handler![ ... ]` se agregan:
```rust
commands::weekly_schedule::list_schedule_blocks,
commands::weekly_schedule::create_schedule_block,
commands::weekly_schedule::update_schedule_block,
commands::weekly_schedule::delete_schedule_block,
commands::weekly_schedule::upsert_all_schedule_blocks,
```
Y en `src-tauri/src/commands/mod.rs`: `pub mod weekly_schedule;`.
En `src-tauri/src/db/mod.rs` (`run_migrations`): agregar `include_str!("migrations/005_weekly_schedule.sql")` al listado versionado.

### 7.5 `src/lib/db.ts` — exports nuevos

```ts
// ───────────────────────────────────────────────────────────────
// Cronograma Semanal
// ───────────────────────────────────────────────────────────────

export async function listScheduleBlocks(): Promise<ScheduleBlockRow[]> {
  const raw = await invoke<unknown>("list_schedule_blocks");
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((r) => ScheduleBlockRowSchema.parse(r));
}

export async function createScheduleBlock(
  draft: CreateScheduleBlockDraft,
  id: string,
  created_at: string,
  updated_at: string,
): Promise<ScheduleBlockRow> {
  const v = CreateScheduleBlockDraftSchema.parse(draft);
  const raw = await invoke<unknown>("create_schedule_block", {
    input: { id, ...v, created_at, updated_at },
  });
  return ScheduleBlockRowSchema.parse(raw);
}

export async function updateScheduleBlock(
  id: string,
  patch: UpdateScheduleBlockDraft,
  updated_at: string,
): Promise<ScheduleBlockRow> {
  const v = UpdateScheduleBlockDraftSchema.parse(patch);
  const raw = await invoke<unknown>("update_schedule_block", {
    input: { id, ...v, updated_at },
  });
  return ScheduleBlockRowSchema.parse(raw);
}

export async function deleteScheduleBlock(id: string): Promise<void> {
  await invoke("delete_schedule_block", { id });
}

export async function upsertAllScheduleBlocks(
  rows: ScheduleBlockRow[],
): Promise<void> {
  await invoke("upsert_all_schedule_blocks", { blocks: rows });
}

// Settings persisten en config table (key weekly-schedule-settings)
export async function loadWeeklyScheduleSettings(): Promise<WeeklyScheduleSettings> {
  const json = await loadConfig("weekly-schedule-settings");
  if (!json) return DEFAULT_WEEKLY_SCHEDULE_SETTINGS;
  return WeeklyScheduleSettingsSchema.parse(JSON.parse(json));
}

export async function saveWeeklyScheduleSettings(
  settings: WeeklyScheduleSettings,
): Promise<void> {
  const parsed = WeeklyScheduleSettingsSchema.parse(settings);
  await saveConfig("weekly-schedule-settings", JSON.stringify(parsed));
}
```

(Igual a `db.ts:57-78` patrón: parse input → invoke → parse row).

## 8. Lógica de dominio (TS puro) — `src/stores/weeklySchedule.ts`

El store contiene **toda** la lógica (snap, overlaps, validación, conversiones). Sigue `stores/habits.ts` (setup-store, IDs/timestamps generados en cliente):

```ts
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import * as db from "../lib/db";
import {
  type CreateScheduleBlockDraft, type ScheduleBlock, type UpdateScheduleBlockDraft,
  type WeeklyScheduleSettings, DEFAULT_WEEKLY_SCHEDULE_SETTINGS,
  rowToScheduleBlock, scheduleBlockToRow,
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
    for (const b of blocks.value) map.get(b.day_of_week)!.push(b);
    for (const list of map.values())
      list.sort((a, b) => a.start_minutes - b.start_minutes);
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
    } catch (e) { lastError.value = String(e); }
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
```

## 9. Composable DnD — `src/composables/useScheduleDrag.ts`

Wrapper sobre `interactjs` (patrón de `useDashDrag.ts`). Solo `draggable` (sin `resizable`):

```ts
import interact from "@interactjs/interact";
import type { Interactable } from "@interactjs/interact";
import { onUnmounted, type Ref } from "vue";

interface DragCtx {
  columnWidthPx: () => number;   // containerWidth / 7
  rowHeightPx:   () => number;   // visibleHeight / visibleRows
  dayStart:       () => number;  // minutes
  granularity:    () => number;  // minutes
  onEnd: (day: number, start_minutes: number, end_minutes: number) => void;
  onOverrideRejected: () => void; // feedback visual si overlap
}

export function useScheduleDrag(elRef: Ref<HTMLElement | null>, ctx: DragCtx) {
  let interactable: Interactable | null = null;

  function init() {
    if (!elRef.value) return;
    interactable = interact(elRef.value).draggable({
      inertia: false,
      modifiers: [],
      listeners: {
        end(event) {
          const dx = event.rect.left - event.target.getBoundingClientRect().left + event.dx;
          const dy = event.dy;
          const colWidth = ctx.columnWidthPx();
          const minuteHeight = ctx.rowHeightPx() / ctx.granularity();
          const dayStart = ctx.dayStart();
          const current = (event.target as HTMLElement).dataset;
          const currentDay = Number(current.day ?? "0");
          const currentStart = Number(current.start ?? "0");
          const currentEnd = Number(current.end ?? "0");
          const duration = currentEnd - currentStart;

          const dayDelta = Math.round(dx / colWidth);
          let newDay = currentDay + dayDelta;
          newDay = Math.min(6, Math.max(0, newDay));

          const minuteDelta = dy / minuteHeight;
          let newStart = currentStart + minuteDelta;
          newStart = Math.min(1440 - duration, Math.max(dayStart, newStart));
          newStart = Math.floor(newStart / ctx.granularity()) * ctx.granularity();

          const newEnd = newStart + duration;
          if (newEnd > 1440) { ctx.onOverrideRejected(); return; }

          ctx.onEnd(newDay, newStart, newEnd);
        },
      },
    });
  }

  onUnmounted(() => { interactable?.unset(); });
  return { init };
}
```

(El feedback de overlap y la reversión visual la maneja `WeeklyScheduleBlock.vue` capturando el reject del store.)

## 10. Componentes Vue

### 10.1 `WeeklyScheduleWidget.vue` (contenedor abstracto)

Sigue el patrón de `HabitsWidget.vue` (Container + `container-type: inline-size`) pero con **header propio** (no es wrapper de una view):

```vue
<script setup lang="ts">
import { onMounted, ref } from "vue";
import Container from "@/components/ui/Container.vue";
import IconButton from "@/components/ui/IconButton.vue";
import WeeklyScheduleGrid from "./WeeklyScheduleGrid.vue";
import WeeklyScheduleModal from "./WeeklyScheduleModal.vue";
import WeeklyScheduleSettingsModal from "./WeeklyScheduleSettingsModal.vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import type { ScheduleBlock } from "@/schemas/weeklySchedule";

const store = useWeeklyScheduleStore();
const editingBlock = ref<ScheduleBlock | null>(null);
const showCreate = ref(false);
const showSettings = ref(false);

onMounted(() => store.loadAll());

function openEdit(b: ScheduleBlock) { editingBlock.value = b; }
</script>

<template>
  <Container variant="default" padding="none" class="h-full overflow-hidden"
             style="container-type: inline-size" data-testid="weekly-schedule-widget">
    <div class="flex flex-col h-full min-h-0">
      <header class="flex items-center justify-between px-3 py-2 border-b border-hairline">
        <h2 class="text-card-title text-ink">Cronograma Semanal</h2>
        <div class="flex items-center gap-1">
          <IconButton icon="settings" label="Ajustes" @click="showSettings = true" />
          <IconButton icon="plus" label="Nuevo bloque" @click="showCreate = true" />
        </div>
      </header>
      <WeeklyScheduleGrid class="flex-1 min-h-0 overflow-auto" @edit="openEdit" />
    </div>
    <WeeklyScheduleModal :open="showCreate" :block="null" @close="showCreate = false" />
    <WeeklyScheduleModal :open="!!editingBlock" :block="editingBlock"
                         @close="editingBlock = null" />
    <WeeklyScheduleSettingsModal :open="showSettings" @close="showSettings = false" />
  </Container>
</template>
```

Registro en `src/lib/dashboardWidgets.ts` (al final del array `widgets`):

```ts
{
  id: "weekly-schedule",
  title: "Cronograma Semanal",
  icon: "calendar-week",
  component: WeeklyScheduleWidget,
  minWidthPercent: 0.4,
  minHeightPercent: 0.4,
  defaultX: 0,
  defaultY: 0.7,
  defaultWPercent: 1,
  defaultHPercent: 0.5,
},
```
(con `import WeeklyScheduleWidget from "@/components/dashboard/WeeklyScheduleWidget.vue";` arriba).

### 10.2 `WeeklyScheduleGrid.vue`

Layout con 7 columnas (Lun→Dom) y filas horarias. Cada bloque es `<WeeklyScheduleBlock>` posicionado con `style` absoluto:

```vue
<script setup lang="ts">
import { computed, ref, watch, useTemplateRef } from "vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import { minutesToHHMM } from "@/stores/weeklySchedule";
import WeeklyScheduleBlock from "./WeeklyScheduleBlock.vue";
import type { ScheduleBlock } from "@/schemas/weeklySchedule";

const store = useWeeklyScheduleStore();
const emit = defineEmits<{ edit: [block: ScheduleBlock] }>();

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"]; // 0=Lun .. 6=Dom

const containerRef = useTemplateRef<HTMLElement>("containerRef");
const width = ref(0); const height = ref(0);
function measure() {
  if (!containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  width.value = rect.width; height.value = rect.height;
}
new ResizeObserver(measure).observe /* … en onMounted */;
watch(() => store.settings, measure, { deep: true });

const visibleRows = computed(() =>
  Math.floor((store.settings.day_end_minutes - store.settings.day_start_minutes)
             / store.settings.granularity_minutes));
const minuteHeight = computed(() =>
  (store.settings.granularity_minutes / store.settings.granularity_minutes)
    && height.value / visibleRows.value * /* … */ 1);
// minuteHeightPx = height / visibleRows / (granularity/min por fila)
// Simpler: rowHeightPx = height / visibleRows ; minuteHeightPx = rowHeightPx / granularity
const rowHeightPx = computed(() => visibleRows.value > 0 ? height.value / visibleRows.value : 0);
const minuteHeightPx = computed(() => rowHeightPx.value / store.settings.granularity_minutes);
const columnWidthPx = computed(() => width.value / 7);
const dayStart = computed(() => store.settings.day_start_minutes);

const hourLabels = computed(() => {
  const out: { minute: number; label: string }[] = [];
  for (let m = dayStart.value; m < store.settings.day_end_minutes;
       m += store.settings.granularity_minutes) {
    out.push({ minute: m, label: minutesToHHMM(m) });
  }
  return out;
});

function blockTopPx(b: ScheduleBlock) { return (b.start_minutes - dayStart.value) * minuteHeightPx.value; }
function blockHeightPx(b: ScheduleBlock) { return (b.end_minutes - b.start_minutes) * minuteHeightPx.value; }
function blockLeftPct(day: number) { return (day / 7) * 100; }
function blockWidthPct() { return (1 / 7) * 100; }
</script>

<template>
  <div ref="containerRef" class="relative w-full h-full min-h-0">
    <!-- grilla de fondo + etiquetas -->
    <div class="grid" :style="gridTemplateStyle">
      <!-- columna de etiquetas de hora -->
      <div class="border-r border-hairline">
        <div v-for="hl in hourLabels" :key="hl.minute"
             :style="{ height: rowHeightPx + 'px' }"
             class="text-caption text-ink-subtle px-1 flex items-start">{{ hl.label }}</div>
      </div>
      <!-- 7 columnas de días -->
      <div v-for="day in 7" :key="day"
           class="border-r border-hairline relative">
        <div class="text-caption text-ink-muted px-1 py-1 border-b border-hairline">
          {{ DAYS[day - 1] }}
        </div>
      </div>
    </div>
    <!-- bloques absolutos -->
    <WeeklyScheduleBlock v-for="b in store.blocks" :key="b.id" :block="b"
      :minute-height-px="minuteHeightPx" :day-start="dayStart"
      :column-width-px="columnWidthPx"
      :style="{
        position: 'absolute',
        top: blockTopPx(b) + 'px',
        height: blockHeightPx(b) + 'px',
        left: 'calc(' + blockLeftPct(b.day_of_week) + '% + ' + labelWidthPx + 'px)',
        width: 'calc(' + blockWidthPct() + '% - ' + labelWidthPx + 'px)',
      }"
      @click="emit('edit', b)" @moved="(...args) => handleMoved(b.id, ...args)" />
  </div>
</template>
```

(El `labelWidthPx` es el ancho de la columna de etiquetas — se mide una sola vez o se fija a un valor responsive con `cqw`.)

### 10.3 `WeeklyScheduleBlock.vue`

Bloque draggable (solo activo si `ui.editMode`). Color con clase token (`bg-primary/15 border-primary text-ink`):

```vue
<script setup lang="ts">
import { useUiStore } from "@/stores/ui";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import type { ScheduleBlock } from "@/schemas/weeklySchedule";

const props = defineProps<{
  block: ScheduleBlock;
  minuteHeightPx: number;
  dayStart: number;
  columnWidthPx: number;
}>();

const emit = defineEmits<{ click: []; moved: [day: number, start: number, end: number] }>();

const ui = useUiStore();
const store = useWeeklyScheduleStore();

const colorClasses: Record<string, string> = {
  primary: "bg-primary/15 border-primary text-ink",
  "primary-hover": "bg-primary-hover/15 border-primary-hover text-ink",
  success: "bg-success/15 border-success text-ink",
  "brand-secure": "bg-brand-secure/15 border-brand-secure text-ink",
  "surface-4": "bg-surface-4 border-strong text-ink",
  canvas: "bg-canvas border-hairline text-ink",
  overlay: "bg-overlay/30 border-hairline text-ink",
};

// useScheduleDrag init... (si editMode)
async function onMoved(day: number, start: number, end: number) {
  try {
    await store.moveBlockAfterDrag(props.block.id, day, start, end);
    emit("moved", day, start, end);
  } catch {
    // overlap → revertir (interactjs deja elemento en posición original por su cuenta)
    // feedback visual: clase temporal border-error fugaz
  }
}
</script>

<template>
  <button :class="['absolute rounded-sm border px-1 text-button text-left truncate',
                    colorClasses[block.color]]"
          :data-day="block.day_of_week" :data-start="block.start_minutes"
          :data-end="block.end_minutes"
          :style="{ cursor: ui.editMode ? 'grab' : 'pointer' }"
          @click="emit('click')">
    {{ block.title }}
  </button>
</template>
```

### 10.4 `WeeklyScheduleModal.vue`

Usa `src/components/ui/Modal.vue`. Form con `Input`, radios de color, select día, inputs time. Validación de overlap antes de guardar (llama `store.validateBlock` / acciones):

```vue
<script setup lang="ts">
import { ref, watch } from "vue";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import { BLOCK_COLOR_TOKENS, type ScheduleBlock } from "@/schemas/weeklySchedule";
import { minutesToHHMM, hhmmToMinutes } from "@/stores/weeklySchedule";

const props = defineProps<{ open: boolean; block: ScheduleBlock | null }>();
const emit = defineEmits<{ close: [] }>();
const store = useWeeklyScheduleStore();

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const title = ref(""); const color = ref<(typeof BLOCK_COLOR_TOKENS)[number]>("primary");
const day = ref(0); const start = ref("06:00"); const end = ref("07:00");
const error = ref<string | null>(null);

watch(() => props.open, (o) => {
  if (!o) return;
  error.value = null;
  if (props.block) {
    title.value = props.block.title; color.value = props.block.color;
    day.value = props.block.day_of_week;
    start.value = minutesToHHMM(props.block.start_minutes);
    end.value = minutesToHHMM(props.block.end_minutes);
  } else {
    title.value = ""; color.value = "primary"; day.value = 0;
    start.value = "06:00"; end.value = "07:00";
  }
});

async function save() {
  error.value = null;
  try {
    const s = hhmmToMinutes(start.value); const e = hhmmToMinutes(end.value);
    if (e <= s) { error.value = "La hora de fin debe ser mayor que la de inicio"; return; }
    const draft = { day_of_week: day.value, start_minutes: s, end_minutes: e,
                    title: title.value, color: color.value, sort_order: 0 };
    if (props.block) await store.updateBlock(props.block.id, draft);
    else await store.createBlock(draft);
    emit("close");
  } catch (e) { error.value = String(e); }
}

async function remove() {
  if (!props.block) return;
  await store.deleteBlock(props.block.id);
  emit("close");
}
</script>

<template>
  <Modal :open="open" size="md" @close="emit('close')">
    <div class="p-4">
      <h3 class="text-card-title text-ink mb-3">
        {{ block ? "Editar bloque" : "Nuevo bloque" }}
      </h3>
      <label class="block text-caption text-ink-muted mb-1">Título</label>
      <Input v-model="title" placeholder="Ej. Gimnasio" />
      <label class="block text-caption text-ink-muted mt-3 mb-1">Color</label>
      <div class="flex gap-2">
        <button v-for="c in BLOCK_COLOR_TOKENS" :key="c" type="button"
          :class="['w-6 h-6 rounded-sm border-2', c === color ? 'border-ink' : 'border-transparent']"
          :style="{ background: `rgb(var(--color-${c}) / 1)` }"
          @click="color = c" :aria-label="c" />
      </div>
      <label class="block text-caption text-ink-muted mt-3 mb-1">Día</label>
      <select v-model="day" class="bg-surface-2 border border-hairline rounded-sm px-2 py-1 text-body">
        <option v-for="(d, i) in DAYS" :key="i" :value="i">{{ d }}</option>
      </select>
      <div class="flex gap-3 mt-3">
        <div>
          <label class="block text-caption text-ink-muted mb-1">Inicio</label>
          <Input type="time" v-model="start" />
        </div>
        <div>
          <label class="block text-caption text-ink-muted mb-1">Fin</label>
          <Input type="time" v-model="end" />
        </div>
      </div>
      <p v-if="error" class="text-body-sm text-primary mt-2">{{ error }}</p>
      <div class="flex justify-between mt-4">
        <Button v-if="block" variant="ghost" @click="remove">Eliminar</Button>
        <div v-else />
        <div class="flex gap-2">
          <Button variant="ghost" @click="emit('close')">Cancelar</Button>
          <Button @click="save">{{ block ? "Guardar" : "Crear" }}</Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
```

### 10.5 `WeeklyScheduleSettingsModal.vue`

```vue
<script setup lang="ts">
import { ref, watch, computed } from "vue";
import Modal from "@/components/ui/Modal.vue";
import Button from "@/components/ui/Button.vue";
import Input from "@/components/ui/Input.vue";
import { useWeeklyScheduleStore } from "@/stores/weeklySchedule";
import { minutesToHHMM, hhmmToMinutes } from "@/stores/weeklySchedule";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: [] }>();
const store = useWeeklyScheduleStore();

const granularity = ref(30); const start = ref("06:00"); const end = ref("23:00");
const error = ref<string | null>(null);

watch(() => props.open, (o) => {
  if (!o) return;
  error.value = null;
  granularity.value = store.settings.granularity_minutes;
  start.value = minutesToHHMM(store.settings.day_start_minutes);
  end.value = minutesToHHMM(store.settings.day_end_minutes);
});

async function save() {
  error.value = null;
  const s = hhmmToMinutes(start.value); const e = hhmmToMinutes(end.value);
  if (e - s < granularity.value) {
    error.value = "El rango debe contener al menos un slot";
    return;
  }
  await store.saveSettings({
    granularity_minutes: granularity.value as 15 | 30 | 60,
    day_start_minutes: s, day_end_minutes: e,
  });
  emit("close");
}
</script>

<template>
  <Modal :open="open" size="sm" @close="emit('close')">
    <div class="p-4">
      <h3 class="text-card-title text-ink mb-3">Ajustes del cronograma</h3>
      <label class="block text-caption text-ink-muted mb-1">Granularidad</label>
      <div class="flex gap-2">
        <button v-for="g in [15, 30, 60]" :key="g"
          :class="['px-3 py-1 rounded-sm border', granularity === g
                   ? 'bg-primary border-primary text-ink' : 'border-hairline text-ink-muted']"
          @click="granularity = g">{{ g }} min</button>
      </div>
      <div class="flex gap-3 mt-3">
        <div>
          <label class="block text-caption text-ink-muted mb-1">Desde</label>
          <Input type="time" v-model="start" />
        </div>
        <div>
          <label class="block text-caption text-ink-muted mb-1">Hasta</label>
          <Input type="time" v-model="end" />
        </div>
      </div>
      <p v-if="error" class="text-body-sm text-primary mt-2">{{ error }}</p>
      <div class="flex justify-end gap-2 mt-4">
        <Button variant="ghost" @click="emit('close')">Cancelar</Button>
        <Button @click="save">Guardar</Button>
      </div>
    </div>
  </Modal>
</template>
```

## 11. Detalles de layout (requisito clave)

**Requisito del usuario**: dentro de un contenedor abstracto; "cronograma que se repita lindo y simple"; con botones de agregar/ajustes.

- **Contenedor**: `Container.vue` estándar (`bg-surface-1 border border-hairline rounded-sm select-none min-h-0`) + `container-type: inline-size` para responsive.
- **Header**: `flex items-center justify-between` con título `text-card-title text-ink` "Cronograma Semanal" a la izquierda; botones `Ajustes` y `Nuevo bloque` (`IconButton`) a la derecha.
- **Grilla**: `display:grid` con 8 columnas (1 etiquetas + 7 días) o bien etiquetas en columna izquierda y 7 días en `grid-template-columns`. Filas: una por slot de `granularity_minutes` entre `day_start_minutes` y `day_end_minutes`.
- **Bloques**: posicionamiento absoluto dentro de su columna; `top = (start - dayStart) * minuteHeightPx`; `height = (end - start) * minuteHeightPx`. Drag solo en `editMode`.
- **Scroll**: si el rango visible excede el alto del widget, `overflow-y: auto` en el área de grilla.
- **Orden días**: Lun→Dom fijo (MVP). `DAYS = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"]`.
- **Colores**: clases Tailwind basadas en tokens (`bg-primary/15 border-primary`) — nunca hex hardcodeado, cumple `AGENTS.md`.

## 12. Flujo de interacción paso a paso

### Crear bloque
1. Click en `+` del header → `WeeklyScheduleModal` con `block=null`.
2. Usuario completa título, color, día, start, end.
3. Click `Crear` → `validateBlock` (overlap) → si OK `store.createBlock` → persistir → cerrar.
4. Si overlap → mensaje inline, permanece abierto.

### Mover bloque (DnD)
1. `ui.editMode = true` (toggle en Sidebar).
2. Usuario arrastra un bloque. `useScheduleDrag` calcula delta X/Y →Δdías →Δminutos.
3. Al soltar: `store.moveBlockAfterDrag(id, day, start, end)` → `validateBlock(ignoreId=id)`.
4. Si OK → persistir y el bloque queda en la posición nueva.
5. Si overlap → revertir posición (interactjs ya lo deja en origen si `onEnd` lanza) + feedback visual fugaz.

### Editar bloque
1. Click en bloque (con `editMode` true o false) → `WeeklyScheduleModal` con el bloque cargado.
2. Cambia campos → `Guardar` → `store.updateBlock` (valida overlap ignorando `id` propio).
3. `Eliminar` → `store.deleteBlock`.

### Ajustes
1. Click `⚙` del header → `WeeklyScheduleSettingsModal`.
2. Cambia granularidad / rango → `Guardar` → `store.saveSettings` → re-render de la grilla.

## 13. Estrategia de tests (TDD estricto — `AGENTS.md`)

Por cada archivo `.ts`/`.vue` el `.test.ts` al lado, primero **rojo**, después **verde**, refactorizar:

| # | Archivo de test | Qué cubre |
|---|---|---|
| 1 | `src/schemas/weeklySchedule.test.ts` | Acepta/rechaza casos; invariante `end > start`; `blockColorSchema` enum; mappers round-trip (`rowToScheduleBlock` ↔ `scheduleBlockToRow`); defaults de `WeeklyScheduleSettings` |
| 2 | `src/stores/weeklySchedule.test.ts` | `minutesToHHMM`/`hhmmToMinutes` round-trip; `snapToSlot` (15/30/60); `overlaps` (casos bordes); `wouldOverlapOnDay`; `validateBlock` (overlap/rango); acciones `loadAll/createBlock/updateBlock/deleteBlock/moveBlockAfterDrag` con `vi.mock("@/lib/db")`. Sin Tauri real. |
| 3 | `src/components/dashboard/WeeklyScheduleBlock.test.ts` | props/emit (click → emit `click`; color por clase token; cursor `grab` solo en editMode). No accede estado interno. |
| 4 | `src/components/dashboard/WeeklyScheduleModal.test.ts` | render crear vs editar; validación `end > start`; envío de draft vía emit/acción; click eliminar llama `deleteBlock`. Mock store si hace falta. |
| 5 | `src/components/dashboard/WeeklyScheduleSettingsModal.test.ts` | granularidad radios; error si rango < granularity; `save` llama `saveSettings` con payload correcto. |
| 6 | `src/components/dashboard/WeeklyScheduleGrid.test.ts` | render 7 columnas en orden Lun→Dom; etiquetas de hora desde `day_start` a `day_end`; `@edit` se emite al click en bloque. |
| 7 | `src/components/dashboard/WeeklyScheduleWidget.test.ts` (smoke) | render en `Container`; header contiene título "Cronograma Semanal" + `+` + `⚙`; `+` abre modal crear; click en bloque abre modal editar. |
| 8 | `src/lib/dashboardWidgets.test.ts` (si existe o nuevo) | `getWidgetById("weekly-schedule")` devuelve la entrada con componente correcto. |
| 9 | `cargo check` en `src-tauri/` (sin tests de migración por ahora). |
| 10 | `npm run test` + `npm run build` verde. |

`vi.mock("@/lib/db", () => ({ listScheduleBlocks: vi.fn().mockResolvedValue([]), ... }))`.

## 14. Plan de ejecución (TDD, por fases)

### Fase A — Datos (Rust + schema + db.ts)
1. Test `schemas/weeklySchedule.test.ts` (rojo) → impl schema + mappers → verde.
2. Migration `005_weekly_schedule.sql` + comando `weekly_schedule.rs` + registro en `lib.rs` y `commands/mod.rs`.
3. Test store con `vi.mock` de `db.ts` (rojo) → impl exports `db.ts` `*ScheduleBlock*` + `load/saveWeeklyScheduleSettings` → verde.
4. `cargo check` en `src-tauri/`.

### Fase B — Store + lógica de dominio
5. Test `stores/weeklySchedule.test.ts` para `overlaps`, `wouldOverlapOnDay`, `snapToSlot`, conversión HH:MM↔min, `validateBlock`, `moveBlockAfterDrag` (rojo) → impl store → verde.
6. Acciones `loadAll/createBlock/updateBlock/deleteBlock` mockeando `db.ts`.

### Fase C — UI básica (sin DnD)
7. Test `WeeklyScheduleWidget.test.ts` smoke + `WeeklyScheduleModal.test.ts` + `WeeklyScheduleSettingsModal.test.ts` (rojo) → impl widgets + grid + modales → verde.
8. Registro en `dashboardWidgets.ts`.

### Fase D — DnD
9. Test `WeeklyScheduleBlock.test.ts` (emit/click, render conditional color) → impl `WeeklyScheduleBlock.vue` con interactjs → `useScheduleDrag.ts` → verde.
10. Validación de overlap al soltar → feedback visual (clase fugaz) y revertir posición.

### Fase E — Pulido y verificación
11. `npm run test` verde.
12. `npm run build` verde (types + build).
13. `cargo check` en `src-tauri/` verde.
14. Manual `npm run tauri dev`: crear, mover, editar, eliminar, ajustar settings; crear bloque solapado y confirmar rechazo.

## 15. Riesgos técnicos

1. **`interactjs` snap a columnas**: `interactjs` no provee snap nativo a celdas bidimensionales custom. Se calcula el delta en píxeles y se mapea manualmente a día/hora en `onEnd`. Si la precisión es pobre, fallback: usar `dropzone` por columna (cada columna es un `dropzone` y la posición Y relativa determina el slot) — evaluar en Fase D.
2. **Overlap solo validado en TS**: un_row malicioso en SQLite directo podría solapar. No crítico para single-user local.
3. **Settings en `config`**: JSON serializado; cambio de settings no requiere migración. Validar parse en `loadWeeklyScheduleSettings` (fallback a defaults si corrupto).
4. **Layout responsive**: muchos `cqw`/ResizeObserver. Asegurar `min-height:0` y `overflow:auto` para evitar desborde en widgets pequeños.
5. **`week_starts_monday`**: queda en schema (`true`) pero sin UI en MVP. Si se expone después, hay un campo listo.
6. **Divergencias docs vs código** (ya confirmadas): `interactjs` (no `vue-grid-layout`), SQLite `config` (no localStorage), sin router (`viewMode` en Pinia) — el spec usa lo real.

## 16. Definition of Done

- [ ] Scope: solo lo de arriba (sin overlay, sin resize por borde, sin notificaciones).
- [ ] Widget "Cronograma Semanal" registrado en `dashboardWidgets.ts` y aparece en el `WidgetPicker`.
- [ ] Contenedor abstracto con header conteniendo título **"Cronograma Semanal"** + botón `+` (nuevo bloque) + botón `⚙` (ajustes).
- [ ] Grilla 7 columnas **Lun→Dom** × filas horarias basadas en `granularity_minutes`.
- [ ] Bloques con `título + color (paleta tokens) + día + start_minutes + end_minutes`.
- [ ] Crear bloque desde `+` abre `WeeklyScheduleModal` y persiste.
- [ ] Editar/eliminar bloque por click abre `WeeklyScheduleModal` (precargado) y persiste.
- [ ] Drag-and-drop con snap a grilla en `editMode`; mueve entre columnas/horarios; rechaza si overlap.
- [ ] `WeeklyScheduleSettingsModal` cambia granularidad (15/30/60) + rango (start/end) y persiste en `config`.
- [ ] Validación de no solapamiento en TS antes de persistir (con feedback claro).
- [ ] Migración `005_weekly_schedule.sql` + 5 comandos Rust en `lib.rs`.
- [ ] `days_of_week` numérica: 0=Lunes .. 6=Domingo (ISO).
- [ ] Colores via clases Tailwind de tokens (`bg-primary/15 border-primary`…) — sin hex.
- [ ] Todo `.ts`/`.vue` con `.test.ts` al lado; `npm run test` verde; `npm run build` verde; `cargo check` verde.
- [ ] Sin TODOs, código muerto ni comentarios. Sin dependencias nuevas.
- [ ] `docs/IDEAS.md` marcado el widget como implementado.

## 17. Out of scope (futuro)

- Overlay de hábitos/tareas/goals/calendar sobre la grilla (lectura derivada).
- Resize de bloques arrastrando bordes.
- Día de inicio de semana configurable en UI (`week_starts_monday`).
- Notificaciones "X en 10 min" (requiere plugin Tauri nuevo).
- Plantillas múltiples (varios cronogramas).
- Drag multi-selección.
- Color libre (hex picker).
- Exportar/importar plantilla (JSON).