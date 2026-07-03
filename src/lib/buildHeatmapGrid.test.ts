import { describe, it, expect } from "vitest";
import { buildHeatmapGrid, HISTORY_COLS } from "./buildHeatmapGrid";
import type { HabitLog } from "@/schemas/habits";

function todayLocalStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}
function dateStrOffset(daysAgo: number): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

describe("buildHeatmapGrid (row-major)", () => {
  it("expone HISTORY_COLS = 28", () => {
    expect(HISTORY_COLS).toBe(28);
  });

  it("genera ceil(days/cols)*cols celdas con padding", () => {
    const cells = buildHeatmapGrid({ days: 91, logs: [], cols: 28 });
    expect(cells).toHaveLength(Math.ceil(91 / 28) * 28);
  });

  it("usa HISTORY_COLS por defecto cuando se omite cols", () => {
    const cells = buildHeatmapGrid({ days: 91, logs: [] });
    expect(cells).toHaveLength(Math.ceil(91 / HISTORY_COLS) * HISTORY_COLS);
  });

  it("hoy es la última celda real de la fila 0 (índice cols-1)", () => {
    const cells = buildHeatmapGrid({ days: 91, logs: [], cols: 28 });
    expect(cells[27].date).toBe(todayLocalStr());
    expect(cells[27].isEmpty).toBe(false);
  });

  it("fila 0 = ventana más reciente (hace 27 días → hoy)", () => {
    const cells = buildHeatmapGrid({ days: 91, logs: [], cols: 28 });
    expect(cells[0].date).toBe(dateStrOffset(27));
    expect(cells[27].date).toBe(dateStrOffset(0));
  });

  it("isEmpty solo en el padding derecho de la última fila", () => {
    const cells = buildHeatmapGrid({ days: 91, logs: [], cols: 28 });
    const emptyIndices = cells
      .map((c, i) => (c.isEmpty ? i : -1))
      .filter((i) => i >= 0);
    expect(emptyIndices).toHaveLength(21);
    emptyIndices.forEach((i) => expect(i).toBeGreaterThanOrEqual(91));
  });

  it("marca completada según logs (hoy)", () => {
    const today = todayLocalStr();
    const logs: HabitLog[] = [
      { id: "1", habit_id: "h1", log_date: today, completed_at: today, note: null, created_at: today },
    ];
    const cells = buildHeatmapGrid({ days: 91, logs, cols: 28 });
    expect(cells[27].completed).toBe(true);
    expect(cells[27].date).toBe(today);
  });

  it("días viejos no completados aparecen como completed=false", () => {
    const cells = buildHeatmapGrid({ days: 91, logs: [], cols: 28 });
    expect(cells[0].completed).toBe(false);
    expect(cells[0].isEmpty).toBe(false);
  });
});
