import type { HabitLog } from "@/schemas/habits";

export interface GridCell {
  date: string;
  completed: boolean;
  isEmpty: boolean;
}

function getTodayDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function buildHeatmapGrid(days: number, logs: HabitLog[]): GridCell[] {
  const today = getTodayDate();
  const todayDate = new Date(today + "T00:00:00");

  const totalWeeks = Math.ceil(days / 7);
  const totalCells = totalWeeks * 7;

  const startDate = new Date(todayDate);
  startDate.setDate(startDate.getDate() - (totalCells - 1));

  const completedDates = new Set(logs.map((l) => l.log_date));

  const cells: GridCell[] = [];

  for (let i = 0; i < totalCells; i++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() + i);

    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, "0");
    const d = String(currentDate.getDate()).padStart(2, "0");
    const dateStr = `${y}-${m}-${d}`;

    const isInRange = i >= (totalCells - days);

    cells.push({
      date: dateStr,
      completed: isInRange && completedDates.has(dateStr),
      isEmpty: !isInRange,
    });
  }

  return cells;
}
