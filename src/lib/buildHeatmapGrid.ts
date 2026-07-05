import type { HabitLog } from "@/schemas/habits";

export interface GridCell {
  date: string;
  completed: boolean;
  isEmpty: boolean;
}

export const HISTORY_COLS = 28;

export interface BuildGridOptions {
  days: number;
  logs: HabitLog[];
  cols?: number;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildHeatmapGrid({ days, logs, cols }: BuildGridOptions): GridCell[] {
  const c = cols ?? HISTORY_COLS;
  const completed = new Set(logs.map((l) => l.log_date));
  const rows = Math.ceil(days / c);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const realCells: GridCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = toLocalDateStr(d);
    realCells.push({ date: dateStr, completed: completed.has(dateStr), isEmpty: false });
  }

  const emptyCell: GridCell = { date: "", completed: false, isEmpty: true };
  const flat: GridCell[] = [];
  for (let r = 0; r < rows; r++) {
    const start = days - (r + 1) * c;
    const rowStart = Math.max(0, start);
    const rowEnd = Math.min(days, start + c);
    const rowCells = realCells.slice(rowStart, rowEnd);
    const padCount = c - rowCells.length;
    for (let p = 0; p < padCount; p++) flat.push(emptyCell);
    for (const cell of rowCells) flat.push(cell);
  }
  if (import.meta.env.DEV) {
    console.assert(flat.length === rows * c, `buildHeatmapGrid: expected ${rows * c} cells, got ${flat.length}`);
  }
  return flat;
}
