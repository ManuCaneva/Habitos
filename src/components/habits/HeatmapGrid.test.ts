import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import HeatmapGrid from "./HeatmapGrid.vue";

vi.mock("@/composables/useHeatmapCols", () => ({
  useHeatmapCols: ({ dataCols }: { dataCols: number }) => ({
    cols: ref(dataCols),
    actualCellSize: ref(10),
  }),
}));

function todayLocalStr(): string {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
}

describe("HeatmapGrid (column-major)", () => {
  it("usa repeat(cols, 10px) en grid-template-columns", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 364 } });
    const grid = w.find("[data-testid='heat-grid']");
    expect((grid.element as HTMLElement).style.gridTemplateColumns).toContain("repeat(52");
    expect((grid.element as HTMLElement).style.gridTemplateColumns).toContain("10px");
  });

  it("usa repeat(7, 10px) en grid-template-rows", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 364 } });
    const grid = w.find("[data-testid='heat-grid']");
    expect((grid.element as HTMLElement).style.gridTemplateRows).toContain("repeat(7");
    expect((grid.element as HTMLElement).style.gridTemplateRows).toContain("10px");
  });

  it("usa gap de 2px (separación entre celdas)", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 364 } });
    expect((w.find("[data-testid='heat-grid']").element as HTMLElement).style.gap).toBe("2px");
  });

  it("celdas usan rounded-[2px] (estilo GitHub)", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 364 } });
    const cell = w.find("[data-testid='heat-cell']");
    expect(cell.classes()).toContain("rounded-[2px]");
  });

  it("celdas usan transition-colors duration-200", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 364 } });
    const cell = w.find("[data-testid='heat-cell']");
    expect(cell.classes()).toContain("transition-colors");
    expect(cell.classes()).toContain("duration-200");
  });

  it("rendera cols*rows celdas basado en columnas visibles", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 364 } });
    expect(w.findAll("[data-testid='heat-cell']")).toHaveLength(364);
  });

  it("celda completada usa shadeFor al 100%", () => {
    const today = todayLocalStr();
    const w = mount(HeatmapGrid, {
      props: {
        logs: [{ id: "1", habit_id: "h", log_date: today, completed_at: today, note: null, created_at: today }],
        color: "#5e6ad2", days: 364,
      },
    });
    const filled = w.findAll("[data-testid='heat-cell']").find(
      (el) => (el.element as HTMLElement).style.background === "rgba(94, 106, 210, 1)"
    );
    expect(filled).toBeTruthy();
  });

  it("celda no completada usa shadeFor al 15%", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 364 } });
    const off = w.findAll("[data-testid='heat-cell']").find(
      (el) => (el.element as HTMLElement).style.background === "rgba(94, 106, 210, 0.15)"
    );
    expect(off).toBeTruthy();
  });

  it("hoy completado tiene ring (box-shadow)", () => {
    const today = todayLocalStr();
    const w = mount(HeatmapGrid, {
      props: {
        logs: [{ id: "1", habit_id: "h", log_date: today, completed_at: today, note: null, created_at: today }],
        color: "#5e6ad2", days: 364,
      },
    });
    const ringed = w.findAll("[data-testid='heat-cell']").find(
      (el) => (el.element as HTMLElement).style.boxShadow !== ""
    );
    expect(ringed).toBeTruthy();
  });

  it("usa grid-auto-flow: column para renderizado column-major", () => {
    const w = mount(HeatmapGrid, { props: { logs: [], color: "#5e6ad2", days: 364 } });
    const grid = w.find("[data-testid='heat-grid']");
    expect((grid.element as HTMLElement).style.gridAutoFlow).toBe("column");
  });
});
