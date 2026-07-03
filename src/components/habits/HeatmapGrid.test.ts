import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HeatmapGrid from "./HeatmapGrid.vue";

function todayLocalStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

describe("HeatmapGrid (row-major)", () => {
  it("usa repeat(cols) en grid-template-columns", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 91, cols: 28 } });
    const grid = w.find("[data-testid='heat-grid']");
    expect((grid.element as HTMLElement).style.gridTemplateColumns).toContain("repeat(28");
  });

  it("usa gap-0.5 (separación chica entre celdas)", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 91 } });
    expect(w.find("[data-testid='heat-grid']").classes()).toContain("gap-0.5");
  });

  it("rendera ceil(days/cols)*cols celdas", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 91, cols: 28 } });
    expect(w.findAll("[data-testid='heat-cell']")).toHaveLength(112);
  });

  it("celda completada usa shadeFor al 100%", () => {
    const today = todayLocalStr();
    const w = mount(HeatmapGrid, {
      props: {
        logs: [{ id: "1", habit_id: "h", log_date: today, completed_at: today, note: null, created_at: today }],
        color: "#5e6ad2", days: 91, cols: 28,
      },
    });
    const filled = w.find("[data-testid='heat-cell'][style*='rgba(94, 106, 210, 1)']");
    expect(filled.exists()).toBe(true);
  });

  it("celda no completada usa shadeFor al 15%", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 91, cols: 28 } });
    const off = w.find("[data-testid='heat-cell'][style*='rgba(94, 106, 210, 0.15)']");
    expect(off.exists()).toBe(true);
  });

  it("hoy completado tiene ring (box-shadow)", () => {
    const today = todayLocalStr();
    const w = mount(HeatmapGrid, {
      props: {
        logs: [{ id: "1", habit_id: "h", log_date: today, completed_at: today, note: null, created_at: today }],
        color: "#5e6ad2", days: 91, cols: 28,
      },
    });
    const ringed = w.find("[data-testid='heat-cell'][style*='box-shadow']");
    expect(ringed.exists()).toBe(true);
  });
});
