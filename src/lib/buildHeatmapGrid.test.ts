import { describe, it, expect, afterEach, vi } from "vitest";
import { buildHeatmapGrid, HISTORY_ROWS } from "./buildHeatmapGrid";
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

describe("buildHeatmapGrid (column-major)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("expone HISTORY_ROWS = 7", () => {
    expect(HISTORY_ROWS).toBe(7);
  });

  it("genera ceil(days/rows)*rows celdas con padding", () => {
    const cells = buildHeatmapGrid({ days: 84, logs: [], rows: 7 });
    expect(cells).toHaveLength(Math.ceil(84 / 7) * 7);
  });

  it("usa HISTORY_ROWS por defecto cuando se omite rows", () => {
    const cells = buildHeatmapGrid({ days: 84, logs: [] });
    expect(cells).toHaveLength(Math.ceil(84 / HISTORY_ROWS) * HISTORY_ROWS);
  });

  it("columna 0 = días más antiguos", () => {
    const cells = buildHeatmapGrid({ days: 84, logs: [], rows: 7 });
    expect(cells[0].date).toBe(dateStrOffset(83));
    expect(cells[6].date).toBe(dateStrOffset(77));
  });

  it("última columna = días más recientes (hoy visible)", () => {
    const cells = buildHeatmapGrid({ days: 84, logs: [], rows: 7 });
    const lastColStart = (Math.ceil(84 / 7) - 1) * 7;
    expect(cells[lastColStart].date).toBe(dateStrOffset(6));
    expect(cells[lastColStart + 6].date).toBe(todayLocalStr());
    expect(cells[lastColStart].isEmpty).toBe(false);
  });

  it("isEmpty solo en el padding de la última columna", () => {
    const cells = buildHeatmapGrid({ days: 80, logs: [], rows: 7 });
    const emptyIndices = cells
      .map((c, i) => (c.isEmpty ? i : -1))
      .filter((i) => i >= 0);
    expect(emptyIndices).toHaveLength(4);
    const firstEmpty = Math.min(...emptyIndices);
    const lastEmpty = Math.max(...emptyIndices);
    expect(firstEmpty).toBe(80);
    expect(lastEmpty).toBe(83);
  });

  it("marca completada según logs (hoy en última columna)", () => {
    const today = todayLocalStr();
    const logs: HabitLog[] = [
      { id: "1", habit_id: "h1", log_date: today, completed_at: today, note: null, created_at: today },
    ];
    const cells = buildHeatmapGrid({ days: 84, logs, rows: 7 });
    const lastColStart = (Math.ceil(84 / 7) - 1) * 7;
    expect(cells[lastColStart + 6].completed).toBe(true);
    expect(cells[lastColStart + 6].date).toBe(today);
  });

  it("días viejos no completados aparecen como completed=false", () => {
    const cells = buildHeatmapGrid({ days: 84, logs: [], rows: 7 });
    expect(cells[0].completed).toBe(false);
    expect(cells[0].isEmpty).toBe(false);
  });

  it("days=0 produce un array vacío", () => {
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cells = buildHeatmapGrid({ days: 0, logs: [], rows: 7 });
    expect(cells).toEqual([]);
  });

  it("days=7 produce 7 celdas (1 columna completa)", () => {
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cells = buildHeatmapGrid({ days: 7, logs: [], rows: 7 });
    expect(cells).toHaveLength(7);
    const real = cells.filter((c) => !c.isEmpty);
    const padding = cells.filter((c) => c.isEmpty);
    expect(real).toHaveLength(7);
    expect(padding).toHaveLength(0);
  });

  it("cada columna tiene exactamente rows celdas (grilla rectangular)", () => {
    const scenarios = [
      { days: 84, rows: 7 },
      { days: 56, rows: 7 },
      { days: 70, rows: 7 },
      { days: 7, rows: 7 },
      { days: 1, rows: 7 },
      { days: 80, rows: 7 },
    ];
    for (const { days, rows } of scenarios) {
      vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
      const cells = buildHeatmapGrid({ days, logs: [], rows });
      const cols = Math.ceil(days / rows);
      expect(cells).toHaveLength(cols * rows);
      for (let c = 0; c < cols; c++) {
        const colCells = cells.slice(c * rows, (c + 1) * rows);
        expect(colCells).toHaveLength(rows);
      }
    }
  });
});
