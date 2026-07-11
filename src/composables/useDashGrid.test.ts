import { describe, it, expect } from "vitest";
import { snapToGrid, applyGapToPixel, WIDGET_GAP } from "./useDashGrid";
import type { GridDimensions } from "./useDashGrid";

const dims: GridDimensions = {
  colWidth: 89,
  rowHeight: 80,
  marginX: 12,
  marginY: 12,
  containerWidth: 1200,
  containerHeight: 600,
  cols: 12,
  maxRows: 10,
};

describe("snapToGrid", () => {
  it("devuelve porcentajes (no píxeles)", () => {
    const result = snapToGrid(600, 300, 600, 240, dims);
    expect(result.xPercent).toBeCloseTo(0.5);
    expect(result.yPercent).toBeCloseTo(0.5);
    expect(result.wPercent).toBeCloseTo(0.5);
    expect(result.hPercent).toBeCloseTo(0.4);
  });

  it("mismo input relativo da mismo output en distintos viewports", () => {
    const dimsSmall: GridDimensions = { ...dims, containerWidth: 800, containerHeight: 500 };
    const resultBig = snapToGrid(600, 300, 600, 240, dims);
    const resultSmall = snapToGrid(400, 250, 400, 200, dimsSmall);
    expect(resultBig.wPercent).toBeCloseTo(resultSmall.wPercent);
    expect(resultBig.hPercent).toBeCloseTo(resultSmall.hPercent);
  });

  it("snap a grilla virtual: xPercent es múltiplo de 1/12", () => {
    const result = snapToGrid(150, 0, 100, 80, dims);
    const step = 1 / 12;
    const remainder = result.xPercent % step;
    expect(remainder).toBeLessThan(0.0001);
  });

  it("snap a grilla virtual: yPercent es múltiplo de 1/10", () => {
    const result = snapToGrid(0, 75, 100, 80, dims);
    const step = 1 / 10;
    const remainder = result.yPercent % step;
    expect(remainder).toBeLessThan(0.0001);
  });

  it("snap a grilla virtual: wPercent es múltiplo de 1/12", () => {
    const result = snapToGrid(0, 0, 250, 80, dims);
    const step = 1 / 12;
    const remainder = result.wPercent % step;
    expect(remainder).toBeLessThan(0.0001);
  });

  it("snap a grilla virtual: hPercent es múltiplo de 1/10", () => {
    const result = snapToGrid(0, 0, 100, 125, dims);
    const step = 1 / 10;
    const remainder = result.hPercent % step;
    expect(remainder).toBeLessThan(0.0001);
  });

  it("clampea xPercent para que xPercent + wPercent no exceda 1", () => {
    const result = snapToGrid(9999, 0, 600, 80, dims, { minWPercent: 0.5 });
    expect(result.xPercent + result.wPercent).toBeLessThanOrEqual(1);
  });

  it("clampea yPercent para que yPercent + hPercent no exceda 1", () => {
    const result = snapToGrid(0, 9999, 100, 400, dims, { minHPercent: 0.3 });
    expect(result.yPercent + result.hPercent).toBeLessThanOrEqual(1);
  });

  it("clampea wPercent a minWPercent", () => {
    const result = snapToGrid(0, 0, 10, 80, dims, { minWPercent: 3 / 12 });
    expect(result.wPercent).toBeGreaterThanOrEqual(3 / 12);
  });

  it("clampea hPercent a minHPercent", () => {
    const result = snapToGrid(0, 0, 100, 10, dims, { minHPercent: 3 / 10 });
    expect(result.hPercent).toBeGreaterThanOrEqual(3 / 10);
  });

  it("valores negativos se clampean a 0", () => {
    const result = snapToGrid(-100, -100, 100, 80, dims);
    expect(result.xPercent).toBe(0);
    expect(result.yPercent).toBe(0);
  });
});

describe("applyGapToPixel", () => {
  it("aplica WIDGET_GAP como inset: left/top + halfGap, width/height - gap", () => {
    const result = applyGapToPixel(0, 0, 0.5, 0.4, 1200, 600, 4);
    expect(result.left).toBe(2);
    expect(result.top).toBe(2);
    expect(result.width).toBe(596);
    expect(result.height).toBe(236);
  });

  it("usa WIDGET_GAP por defecto", () => {
    const result = applyGapToPixel(0, 0, 0.5, 0.4, 1200, 600);
    expect(result.width).toBe(1200 * 0.5 - WIDGET_GAP);
    expect(result.height).toBe(600 * 0.4 - WIDGET_GAP);
  });

  it("widgets adyacentes tienen gap total = WIDGET_GAP entre sí", () => {
    const a = applyGapToPixel(0, 0, 0.5, 0.4, 1200, 600, 4);
    const b = applyGapToPixel(0.5, 0, 0.5, 0.4, 1200, 600, 4);
    const distanceBtw = b.left - (a.left + a.width);
    expect(distanceBtw).toBe(4);
  });
});
