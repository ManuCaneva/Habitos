import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HeatmapGrid from "./HeatmapGrid.vue";

describe("HeatmapGrid", () => {
  it("rendera 91 celdas para 91 días", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 91 } });
    expect(w.findAll("[data-testid='heat-cell']")).toHaveLength(91);
  });
  it("usa 13 columnas y 7 filas", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 91 } });
    const grid = w.find("[data-testid='heat-grid']");
    expect(grid.attributes('style')).toContain('repeat(13');
    expect(grid.attributes('style')).toContain('repeat(7');
  });
  it("celda completada usa shadeFor al 100%", () => {
    const today = new Date().toISOString().slice(0, 10);
    const w = mount(HeatmapGrid, {
      props: { logs: [{ id: "1", habit_id: "h", log_date: today, completed_at: today, note: null, created_at: today }], color: "#5e6ad2", days: 91 },
    });
    const filled = w.find("[data-testid='heat-cell'][style*='rgba(94, 106, 210, 1)']");
    expect(filled.exists()).toBe(true);
  });
});
