import { describe, it, expect } from "vitest";
import { widgets, getWidgetById } from "./dashboardWidgets";

describe("dashboardWidgets", () => {
  it("expone el widget de hábitos", () => {
    const widget = getWidgetById("habits");
    expect(widget).toBeDefined();
    expect(widget?.id).toBe("habits");
    expect(widget?.title).toBe("Hábitos");
  });

  it("cada widget tiene dimensiones por defecto válidas", () => {
    widgets.forEach((w) => {
      expect(w.minWidth).toBeGreaterThan(0);
      expect(w.minHeight).toBeGreaterThan(0);
      expect(w.defaultW).toBeGreaterThanOrEqual(w.minWidth);
      expect(w.defaultH).toBeGreaterThanOrEqual(w.minHeight);
      expect(w.defaultX).toBeGreaterThanOrEqual(0);
      expect(w.defaultY).toBeGreaterThanOrEqual(0);
    });
  });

  it("devuelve undefined para un id desconocido", () => {
    expect(getWidgetById("unknown")).toBeUndefined();
  });
});
