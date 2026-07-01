import { describe, it, expect } from "vitest";
import { buildHeatmapGrid } from "./buildHeatmapGrid";
import type { HabitLog } from "@/schemas/habits";

describe("buildHeatmapGrid", () => {
  it("genera 35 celdas para 30 días (7x5)", () => {
    const logs: HabitLog[] = [];
    const cells = buildHeatmapGrid(30, logs);
    expect(cells).toHaveLength(35);
  });

  it("marca celdas como completadas según logs", () => {
    const logs: HabitLog[] = [
      {
        id: "1",
        habit_id: "h1",
        log_date: "2026-06-25",
        completed_at: "2026-06-25T10:00:00.000Z",
        note: null,
        created_at: "2026-06-25T10:00:00.000Z",
      },
    ];
    const cells = buildHeatmapGrid(30, logs);
    const completedCells = cells.filter((c) => c.completed);
    expect(completedCells.length).toBeGreaterThan(0);
  });

  it("hoy cae en la esquina inferior derecha", () => {
    const logs: HabitLog[] = [];
    const cells = buildHeatmapGrid(30, logs);
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    const todayStr = `${y}-${m}-${d}`;

    const lastCell = cells[cells.length - 1];
    expect(lastCell.date).toBe(todayStr);
    expect(lastCell.isEmpty).toBe(false);
  });

  it("celdas fuera del rango están vacías", () => {
    const logs: HabitLog[] = [];
    const cells = buildHeatmapGrid(30, logs);
    const emptyCells = cells.filter((c) => c.isEmpty);
    expect(emptyCells.length).toBeGreaterThan(0);
  });

  it("respeta prop days (60 días)", () => {
    const logs: HabitLog[] = [];
    const cells = buildHeatmapGrid(60, logs);
    expect(cells.length).toBeGreaterThan(35);
  });
});
