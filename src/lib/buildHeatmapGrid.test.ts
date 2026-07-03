import { describe, it, expect, afterEach, vi } from "vitest";
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
  afterEach(() => {
    vi.useRealTimers();
  });

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

  it("days=0 produce un array vacío (sin filas)", () => {
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cells = buildHeatmapGrid({ days: 0, logs: [], cols: 28 });
    expect(cells).toEqual([]);
  });

  it("days=1 produce 28 celdas (1 real + 27 padding)", () => {
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cells = buildHeatmapGrid({ days: 1, logs: [], cols: 28 });
    expect(cells).toHaveLength(28);
    const real = cells.filter((c) => !c.isEmpty);
    const padding = cells.filter((c) => c.isEmpty);
    expect(real).toHaveLength(1);
    expect(padding).toHaveLength(27);
    expect(real[0].completed).toBe(false);
  });

  it("days=90 produce 4 filas con 22 celdas de padding en la última", () => {
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cells = buildHeatmapGrid({ days: 90, logs: [], cols: 28 });
    expect(cells).toHaveLength(112);
    const emptyCount = cells.filter((c) => c.isEmpty).length;
    expect(emptyCount).toBe(22);
    const realCount = cells.filter((c) => !c.isEmpty).length;
    expect(realCount).toBe(90);
  });

  it("days=120 produce 5 filas con 20 celdas de padding en la última", () => {
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cells = buildHeatmapGrid({ days: 120, logs: [], cols: 28 });
    expect(cells).toHaveLength(140);
    const emptyCount = cells.filter((c) => c.isEmpty).length;
    expect(emptyCount).toBe(20);
    const realCount = cells.filter((c) => !c.isEmpty).length;
    expect(realCount).toBe(120);
  });

  it("days=91 sin logs: 91 reales completed=false + 21 padding en última fila", () => {
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cells = buildHeatmapGrid({ days: 91, logs: [], cols: 28 });
    expect(cells).toHaveLength(112);
    const real = cells.filter((c) => !c.isEmpty);
    const padding = cells.filter((c) => c.isEmpty);
    expect(real).toHaveLength(91);
    expect(padding).toHaveLength(21);
    real.forEach((c) => expect(c.completed).toBe(false));
    padding.forEach((c) => expect(c.isEmpty).toBe(true));
  });

  it("days=7 produce 1 fila con 7 reales al inicio + 21 padding al final", () => {
    vi.setSystemTime(new Date("2026-07-01T12:00:00Z"));
    const cells = buildHeatmapGrid({ days: 7, logs: [], cols: 28 });
    expect(cells).toHaveLength(28);
    const first7 = cells.slice(0, 7);
    const last21 = cells.slice(7, 28);
    first7.forEach((c) => expect(c.isEmpty).toBe(false));
    last21.forEach((c) => {
      expect(c.isEmpty).toBe(true);
      expect(c.completed).toBe(false);
    });
  });
});
