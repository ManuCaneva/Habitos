# Spec: Habit Card Glassmorphism Redesign

*Date: 2026-07-02 · Status: Approved*

## Context & Goal

Redesign the habits "today" list so each habit renders as a **vertically-stacked translucent glassmorphism card**: `[white line icon] · [title + streak subtitle] · [state button]`, with a **GitHub-style progress mesh** (7 rows × 13 cols, the habit's color, display-only) as the card's colored background layer. Complete the currently-broken interactions (edit/archive context menu, clickable title) and surface the streak. All business logic stays in TypeScript; **Rust untouched** (golden rule).

The reference was provided as a text description (the model can't read images). That description is authoritative and supersedes earlier Q&A answers (notably: **line icons, not emojis on a chip**).

## Non-goals

- No new Tauri commands, no Rust changes, no SQLite migrations.
- No interactive grid cells (display-only — "ver el progreso").
- No weekday/month labels on the grid (too narrow for `max-w-sm`).
- No full emoji picker (white Lucide line icons only).
- No archived-view full redesign (only light icon-style alignment in `HabitRow`).

## Visual design

### Card container

- Vertically stacked in the existing `max-w-sm` column (width unchanged).
- Translucent dark surface via a new **glassmorphism utility** (`.glass`: `backdrop-blur-sm` + `bg-surface-2/60` + `border-hairline`), rounded `lg` (12px). No drop shadows.
- Replaces the current shared `bg-surface-2` panel + `border-b` dividers → each habit is its own card with a small gap.

### Content row (horizontal, 3 elements)

1. **Line icon (left)** — white Lucide icon (~20px) from `habit.icon` (a curated Lucide name). Default icon on create.
2. **Title + subtitle (center)** — title: `habit.name`, bold, `ink`; **clickable → opens edit modal**. subtitle: streak summary, `ink-muted` (~70%): "Racha de N días" / "Sin racha".
3. **State button (right)** — shape + fill encode state:
   - **Done** (`checked`): filled **square**, `bg = habit.color`, white `Check`.
   - **Not done**: transparent **circle**, `border = habit.color`, white `Plus`.
   - Click → `toggleCheck` (existing `checkIn`/`undoCheckIn` for today).

### Progress mesh (card background layer)

- GitHub-style: **7 rows (Mon→Sun) × 13 columns (weeks)**, small squares, display-only.
- Today = bottom-right cell; chronological left→right, top→bottom.
- Cell states (unambiguous, binary + today-ring):
  - out-of-range padding → transparent
  - in-range empty → `habit.color` @ ~15% opacity
  - completed → `habit.color` @ 100%
  - today (if completed) → `habit.color` @ 100% + subtle ring
- Rendered below the content row, within the card, visible through the translucency (the "mesh behind card, creating depth" effect).

### Menu

- `HabitContextMenu` (Edit / Archive) mounted in the card; opened from a `⋮` button revealed on hover/focus. Fixes the current gap where `HabitCard` toggles `ui.menuOpenForHabitId` but renders no menu.

## Layer-by-layer changes

| Layer | File | Change |
|---|---|---|
| Schema | `src/schemas/habits.ts` | `icon` (exists: string ≤32, nullable) repurposed to store a Lucide name. Add `DEFAULT_HABIT_ICON` constant. No migration (field exists, currently null). |
| lib (new) | `src/lib/icons.ts` | Curated ~24 Lucide icon names + labels (parallel to `HABIT_COLORS`); `DEFAULT_HABIT_ICON`. |
| lib | `src/lib/habitColors.ts` | Add `shadeFor(color, intensity)` → habit color at a given opacity (for mesh tones). |
| lib | `src/lib/buildHeatmapGrid.ts` | Transpose to **weeks-as-columns** (7 rows × N cols, today bottom-right). Extend to 91 days. Add `intensity` to `GridCell` (0 empty / 1 done). |
| Store | `src/stores/habits.ts` | `loadInitialData` loads **91 days** of logs (was 60). Expose `streakFor(habitId)` (wraps existing `currentStreak`) for the subtitle. |
| Component | `src/components/habits/HabitCard.vue` | Full template rewrite: glass card, line icon, title+streak subtitle, state button (square/circle by `checked`), progress mesh, mounted `HabitContextMenu`, title click → `ui.openEdit`. |
| Component | `src/components/habits/HeatmapGrid.vue` | GitHub orientation (`repeat(13,…)` cols × 7 rows); colored tones via `shadeFor`; today bottom-right + ring. |
| Component | `src/components/habits/HabitFormModal.vue` | Add an **icon picker grid** (curated Lucide set) alongside color swatches. Create sets `icon` (default if unset); edit patches `icon`. |
| Component | `src/components/habits/HabitContextMenu.vue` | Logic unchanged; now mounted in `HabitCard`. |
| Component | `src/components/habits/HabitRow.vue` | Light: color dot → white line icon (archived-view consistency). Streak + menu unchanged. |
| View | `src/views/TodayView.vue` | Drop shared panel bg → stacked glass cards with gaps. |
| Styles | `src/styles/tailwind.css`, `tailwind.config.ts` | Add `.glass` utility/token. No hardcoded colors. |
| Rust | `src-tauri/**` | **NONE** (golden rule — Rust is I/O only). |

## Testing (TDD, per AGENTS.md)

Co-located `.test.ts`, isolated, `@/lib/db` mocked. Per-layer:

- `src/lib/icons.test.ts` — set shape, uniqueness, default present.
- `src/lib/buildHeatmapGrid.test.ts` — 7×13 for 91 days, today bottom-right, `intensity` field, weeks-as-columns ordering.
- `src/lib/habitColors.test.ts` — `shadeFor` opacity ramp.
- `src/stores/habits.test.ts` — `loadInitialData` requests 91-day range; `streakFor` returns expected streak (mocked logs).
- `src/components/habits/HabitCard.test.ts` — renders icon/title/streak; button square-vs-circle by `checked`; emits toggle; title click → `edit`; menu present.
- `src/components/habits/HeatmapGrid.test.ts` — 7×13, today bottom-right, tones.
- `HabitFormModal` — icon picker selects/patches `icon`.

## Resolved decisions

- Icons = white Lucide line icons (NOT emojis). Supersedes earlier "emoji on chip."
- Progress mesh = the GitHub grid, glassmorphism-rendered (NOT a separate decorative element).
- Per-habit color drives button + mesh (existing `HABIT_COLORS`).
- Subtitle = streak.
- Grid: 13 weeks (91 days), no labels, display-only, today bottom-right.
- Approach B: complete broken interactions (context menu, clickable title, streak).

## Definition of Done

- `npm run test` green · `npm run build` passes · no TODOs/commented code · Rust untouched · matches the reference as described.

## Spec self-review

- **Placeholders:** none.
- **Internal consistency:** architecture matches feature list; 91-day span consistent across grid + store; cell states are unambiguous (binary + today-ring).
- **Scope:** focused on a single card redesign; not over-scoped.
- **Ambiguity:** resolved — icon type, mesh identity, subtitle, grid span all explicit.
