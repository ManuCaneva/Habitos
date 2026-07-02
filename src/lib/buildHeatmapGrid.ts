import type { HabitLog } from "@/schemas/habits";

export interface GridCell {
  date: string;
  completed: boolean;
  isEmpty: boolean;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildHeatmapGrid(days: number, logs: HabitLog[]): GridCell[] {
  const completed = new Set(logs.map((l) => l.log_date));
  const totalWeeks = Math.ceil(days / 7);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = (today.getDay() + 6) % 7; // 0=Mon..6=Sun

  const start = new Date(today);
  start.setDate(start.getDate() - (totalWeeks - 1) * 7 - todayDow);

  const cells: GridCell[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(start);
      cellDate.setDate(start.getDate() + w * 7 + d);
      const dateStr = toLocalDateStr(cellDate);
      const inRange = cellDate <= today;
      cells.push({
        date: dateStr,
        completed: inRange && completed.has(dateStr),
        isEmpty: !inRange,
      });
    }
  }
  return cells;
}
