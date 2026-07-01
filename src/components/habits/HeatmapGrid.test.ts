import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import HeatmapGrid from "./HeatmapGrid.vue";
import type { HabitLog } from "@/schemas/habits";

describe("HeatmapGrid", () => {
  it("renderiza 35 celdas para 30 días", () => {
    const logs: HabitLog[] = [];
    const wrapper = mount(HeatmapGrid, {
      props: { logs, color: "#5e6ad2", days: 30 },
    });
    const cells = wrapper.findAll("[data-testid='heatmap-cell']");
    expect(cells).toHaveLength(35);
  });

  it("celdas completadas tienen el color del hábito", () => {
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
    const wrapper = mount(HeatmapGrid, {
      props: { logs, color: "#5e6ad2", days: 30 },
    });
    const completedCells = wrapper.findAll("[data-testid='heatmap-cell'].completed");
    expect(completedCells.length).toBeGreaterThan(0);
    const style = completedCells[0].attributes("style");
    expect(style).toContain("background-color");
  });

  it("celdas no completadas tienen bg-surface-2", () => {
    const logs: HabitLog[] = [];
    const wrapper = mount(HeatmapGrid, {
      props: { logs, color: "#5e6ad2", days: 30 },
    });
    const nonCompletedCells = wrapper
      .findAll("[data-testid='heatmap-cell']")
      .filter((c) => !c.classes().includes("completed") && !c.classes().includes("empty"));
    expect(nonCompletedCells.length).toBeGreaterThan(0);
    expect(nonCompletedCells[0].classes()).toContain("bg-surface-2");
  });

  it("celdas vacías son transparentes", () => {
    const logs: HabitLog[] = [];
    const wrapper = mount(HeatmapGrid, {
      props: { logs, color: "#5e6ad2", days: 30 },
    });
    const emptyCells = wrapper.findAll("[data-testid='heatmap-cell'].empty");
    expect(emptyCells.length).toBeGreaterThan(0);
  });
});
