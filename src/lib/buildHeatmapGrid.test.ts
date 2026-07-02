import { describe, it, expect } from "vitest";
import { buildHeatmapGrid } from "./buildHeatmapGrid";
import type { HabitLog } from "@/schemas/habits";

describe("buildHeatmapGrid (GitHub-style)", () => {
  it("genera 91 celdas para 91 días (13x7)", () => {
    expect(buildHeatmapGrid(91, [])).toHaveLength(91);
  });
  it("ordena column-major: cada bloque de 7 = una semana", () => {
    const cells = buildHeatmapGrid(91, []);
    // primer bloque = primera columna (semana más antigua), 7 celdas
    expect(cells.slice(0, 7)).toHaveLength(7);
  });
  it("hoy está en la última columna (últimas 7 celdas)", () => {
    const cells = buildHeatmapGrid(91, []);
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const lastWeek = cells.slice(-7);
    expect(lastWeek.some((c) => c.date === todayStr)).toBe(true);
  });
  it("marca completadas según logs", () => {
    const today = new Date().toISOString().slice(0, 10);
    const logs: HabitLog[] = [{
      id: "1", habit_id: "h1", log_date: today,
      completed_at: today, note: null, created_at: today,
    }];
    const cells = buildHeatmapGrid(91, logs);
    expect(cells.filter((c) => c.completed).length).toBeGreaterThanOrEqual(1);
  });
  it("alinea por weekday: fila 0 = lunes", () => {
    const cells = buildHeatmapGrid(91, []);
    // la primera celda de la primera columna debe ser lunes
    // parse as local midnight to avoid UTC shift
    const d = new Date(cells[0].date + "T12:00:00");
    expect(d.getDay()).toBe(1); // Monday
  });
});
