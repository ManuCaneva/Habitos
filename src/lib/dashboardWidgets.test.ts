import { describe, it, expect } from "vitest";
import { widgets, getWidgetById } from "./dashboardWidgets";

describe("dashboardWidgets", () => {
  it("expone el widget de hábitos", () => {
    const widget = getWidgetById("habits");
    expect(widget).toBeDefined();
    expect(widget?.id).toBe("habits");
    expect(widget?.title).toBe("Hábitos");
  });

  it("expone el widget de cronograma semanal", () => {
    const widget = getWidgetById("weekly-schedule");
    expect(widget).toBeDefined();
    expect(widget?.id).toBe("weekly-schedule");
    expect(widget?.title).toBe("Cronograma Semanal");
  });

  it("cada widget tiene dimensiones por defecto válidas (porcentajes)", () => {
    widgets.forEach((w) => {
      expect(w.minWidthPercent).toBeGreaterThan(0);
      expect(w.minHeightPercent).toBeGreaterThan(0);
      expect(w.defaultWPercent).toBeGreaterThan(0);
      expect(w.defaultHPercent).toBeGreaterThan(0);
      expect(w.defaultWPercent).toBeLessThanOrEqual(1);
      expect(w.defaultHPercent).toBeLessThanOrEqual(1);
      expect(w.defaultWPercent).toBeGreaterThanOrEqual(w.minWidthPercent);
      expect(w.defaultHPercent).toBeGreaterThanOrEqual(w.minHeightPercent);
    });
  });

  it("widget de hábitos tiene default 50% ancho × 40% alto", () => {
    const widget = getWidgetById("habits")!;
    expect(widget.defaultWPercent).toBeCloseTo(0.5);
    expect(widget.defaultHPercent).toBeCloseTo(0.4);
  });

  it("widget de hábitos permite resize pequeño (mínimo 1/12 ancho, 1/10 alto)", () => {
    const widget = getWidgetById("habits")!;
    expect(widget.minWidthPercent).toBeCloseTo(1 / 12);
    expect(widget.minHeightPercent).toBeCloseTo(1 / 10);
  });

  it("devuelve undefined para un id desconocido", () => {
    expect(getWidgetById("unknown")).toBeUndefined();
  });
});
