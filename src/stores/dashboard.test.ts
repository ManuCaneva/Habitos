import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useDashboardStore, findFreePosition, wouldCollide } from "./dashboard";
import { loadConfig, saveConfig } from "@/lib/db";

vi.mock("@/lib/db", () => ({
  loadConfig: vi.fn().mockResolvedValue(null),
  saveConfig: vi.fn().mockResolvedValue(undefined),
}));

function flush() {
  return new Promise((r) => setTimeout(r, 0));
}

describe("dashboard store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(loadConfig).mockResolvedValue(null);
  });

  it("carga el layout por defecto con porcentajes", async () => {
    const store = useDashboardStore();
    await flush();
    expect(store.layout).toHaveLength(5);
    expect(store.layout[0].i).toBe("habits");
    expect(store.layout[0].wPercent).toBeCloseTo(0.5);
    expect(store.layout[0].hPercent).toBeCloseTo(0.4);
    expect(store.layout[1].i).toBe("tasks");
    expect(store.layout[2].i).toBe("goals");
    expect(store.layout[3].i).toBe("year-calendar");
    expect(store.layout[4].i).toBe("weekly-schedule");
  });

  it("carga layout guardado válido con porcentajes", async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([{ i: "habits", xPercent: 0.1, yPercent: 0, wPercent: 0.4, hPercent: 0.5 }]),
    );
    const store = useDashboardStore();
    await flush();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].xPercent).toBeCloseTo(0.1);
    expect(store.layout[0].wPercent).toBeCloseTo(0.4);
  });

  it("migra layout viejo (w/h) a porcentajes", async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([{ i: "habits", x: 0, y: 0, w: 6, h: 4 }]),
    );
    const store = useDashboardStore();
    await flush();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].wPercent).toBeCloseTo(0.5);
    expect(store.layout[0].hPercent).toBeCloseTo(0.4);
  });

  it("ignora layout inválido y usa default", async () => {
    vi.mocked(loadConfig).mockResolvedValue(JSON.stringify("not-an-array"));
    const store = useDashboardStore();
    await flush();
    expect(store.layout).toHaveLength(5);
    expect(store.layout[0].i).toBe("habits");
  });

  it("filtra items inválidos del layout guardado", async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([
        { i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.3, hPercent: 0.3 },
        { i: "", xPercent: 0, yPercent: 0, wPercent: 0.1, hPercent: 0.1 },
        { xPercent: 0, yPercent: 0, wPercent: 0.1, hPercent: 0.1 },
      ]),
    );
    const store = useDashboardStore();
    await flush();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].i).toBe("habits");
  });

  it("persiste el layout al actualizar", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([{ i: "habits", xPercent: 0.1, yPercent: 0, wPercent: 0.3, hPercent: 0.5 }]);
    expect(saveConfig).toHaveBeenCalledWith("habitos-dashboard-layout", expect.any(String));
    const call = vi.mocked(saveConfig).mock.calls[0];
    const savedData = JSON.parse(call[1] as string);
    expect(savedData[0].wPercent).toBeCloseTo(0.3);
  });

  it("moveTo actualiza posición (porcentajes) y persiste", async () => {
    const store = useDashboardStore();
    await flush();
    // Move to a position that doesn't collide with other widgets
    store.updateLayout([{ i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.3, hPercent: 0.3 }]);
    store.moveTo("habits", 0.1, 0.1);
    expect(store.layout[0].xPercent).toBeCloseTo(0.1);
    expect(store.layout[0].yPercent).toBeCloseTo(0.1);
    const call = vi.mocked(saveConfig).mock.lastCall!;
    const savedData = JSON.parse(call[1] as string);
    expect(savedData[0].xPercent).toBeCloseTo(0.1);
  });

  it("resizeTo actualiza tamaño (porcentajes) y persiste", async () => {
    const store = useDashboardStore();
    await flush();
    // Resize to a size that doesn't collide with other widgets
    store.updateLayout([{ i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.3, hPercent: 0.3 }]);
    store.resizeTo("habits", 0.4, 0.4);
    expect(store.layout[0].wPercent).toBeCloseTo(0.4);
    expect(store.layout[0].hPercent).toBeCloseTo(0.4);
    const call = vi.mocked(saveConfig).mock.lastCall!;
    const savedData = JSON.parse(call[1] as string);
    expect(savedData[0].wPercent).toBeCloseTo(0.4);
  });

  it("moveTo crea nuevo objeto item (no muta el anterior)", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([{ i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.3, hPercent: 0.3 }]);
    const oldItem = store.layout[0];
    store.moveTo("habits", 0.1, 0.1);
    const newItem = store.layout[0];
    expect(newItem).not.toBe(oldItem);
    expect(newItem.xPercent).toBeCloseTo(0.1);
  });

  it("resizeTo crea nuevo objeto item (no muta el anterior)", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([{ i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.3, hPercent: 0.3 }]);
    const oldItem = store.layout[0];
    store.resizeTo("habits", 0.4, 0.4);
    const newItem = store.layout[0];
    expect(newItem).not.toBe(oldItem);
    expect(newItem.wPercent).toBeCloseTo(0.4);
  });

  it("el item original no se muta tras moveTo", async () => {
    const store = useDashboardStore();
    await flush();
    const oldItem = store.layout[0];
    const oldX = oldItem.xPercent;
    store.moveTo("habits", 0.9, 0.5);
    expect(oldItem.xPercent).toBe(oldX);
  });

  it("el item original no se muta tras resizeTo", async () => {
    const store = useDashboardStore();
    await flush();
    const oldItem = store.layout[0];
    const oldW = oldItem.wPercent;
    store.resizeTo("habits", 0.9, 0.7);
    expect(oldItem.wPercent).toBe(oldW);
  });

  it("posiciones por defecto correctas: tasks a la derecha (x=0.5), goals debajo (y=0.4)", async () => {
    const store = useDashboardStore();
    await flush();
    const tasks = store.layout.find((i) => i.i === "tasks")!;
    expect(tasks.xPercent).toBeCloseTo(0.5);
    expect(tasks.yPercent).toBeCloseTo(0);
    const goals = store.layout.find((i) => i.i === "goals")!;
    expect(goals.xPercent).toBeCloseTo(0);
    expect(goals.yPercent).toBeCloseTo(0.4);
  });

  it("addWidget('goals') con layout parcial: solo habits", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([{ i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 }]);
    store.addWidget("goals");
    const item = store.layout.find((i) => i.i === "goals");
    expect(item).toBeDefined();
    expect(item!.xPercent).toBeCloseTo(0);
    expect(item!.yPercent).toBeCloseTo(0.4);
    expect(item!.wPercent).toBeCloseTo(1);
    expect(item!.hPercent).toBeCloseTo(0.3);
  });

  it("addWidget('tasks') con layout parcial: solo habits", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([{ i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 }]);
    store.addWidget("tasks");
    const item = store.layout.find((i) => i.i === "tasks");
    expect(item).toBeDefined();
    expect(item!.xPercent).toBeCloseTo(0.5);
    expect(item!.yPercent).toBeCloseTo(0);
    expect(item!.wPercent).toBeCloseTo(0.5);
    expect(item!.hPercent).toBeCloseTo(0.4);
  });

  it("no agrega un widget duplicado", async () => {
    const store = useDashboardStore();
    await flush();
    store.addWidget("habits");
    expect(store.layout).toHaveLength(5);
  });

  it("elimina un widget del layout", async () => {
    const store = useDashboardStore();
    await flush();
    store.removeWidget("habits");
    expect(store.layout).toHaveLength(4);
  });

  it("resetea al layout por defecto", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([{ i: "habits", xPercent: 0.4, yPercent: 0.4, wPercent: 0.2, hPercent: 0.2 }]);
    store.resetLayout();
    expect(store.layout[0].xPercent).toBe(0);
    expect(store.layout[0].wPercent).toBeCloseTo(0.5);
  });

  it("moveTo rechaza solapamiento real pero permite bordes pegados", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([
      { i: "a", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
      { i: "b", xPercent: 0.5, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
    ]);
    store.moveTo("b", 0.3, 0);
    const after = store.layout.find((i) => i.i === "b")!;
    expect(after.xPercent).toBe(0.5);
  });

  it("moveTo permite ubicar widget pegado a otro (bordes tocados)", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([
      { i: "a", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
      { i: "b", xPercent: 0.5, yPercent: 0.4, wPercent: 0.5, hPercent: 0.3 },
    ]);
    store.moveTo("b", 0, 0.4);
    const after = store.layout.find((i) => i.i === "b")!;
    expect(after.xPercent).toBeCloseTo(0);
    expect(after.yPercent).toBeCloseTo(0.4);
  });

  it("moveTo clampa la posición para no salirse del contenedor", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([
      { i: "a", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
    ]);
    store.moveTo("a", 0.9, 0.9);
    const after = store.layout.find((i) => i.i === "a")!;
    expect(after.xPercent).toBeCloseTo(0.5);
    expect(after.yPercent).toBeCloseTo(0.6);
  });

  it("resizeTo rechaza solapamiento real pero permite bordes pegados", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([
      { i: "a", xPercent: 0, yPercent: 0, wPercent: 0.3, hPercent: 0.3 },
      { i: "b", xPercent: 0.3, yPercent: 0, wPercent: 0.3, hPercent: 0.3 },
    ]);
    store.resizeTo("a", 0.5, 0.3);
    const after = store.layout.find((i) => i.i === "a")!;
    expect(after.wPercent).toBeCloseTo(0.3);
  });

  it("resizeTo clampa tamaño mínimo y máximo", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([
      { i: "a", xPercent: 0, yPercent: 0.5, wPercent: 0.4, hPercent: 0.4 },
    ]);
    store.resizeTo("a", 0.01, 0.9);
    const after = store.layout.find((i) => i.i === "a")!;
    expect(after.wPercent).toBeGreaterThanOrEqual(1 / 12);
    expect(after.hPercent).toBeCloseTo(0.5);
  });

  it("addWidget busca primera posición libre si default está ocupada", () => {
    const layout: import("./dashboard").Layout = [
      { i: "a", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
    ];
    const pos = findFreePosition(0.5, 0.4, layout);
    expect(pos).not.toBeNull();
    expect(pos!.xPercent).toBeGreaterThan(0);
  });

  it("wouldCollide detecta solapamiento", () => {
    const layout: import("./dashboard").Layout = [
      { i: "a", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.5 },
    ];
    expect(wouldCollide(0.3, 0.3, 0.5, 0.5, layout)).toBe(true);
    expect(wouldCollide(0.5, 0.5, 0.5, 0.5, layout)).toBe(false);
    expect(wouldCollide(0.5, 0, 0.5, 0.5, layout, "a")).toBe(false);
  });

  it("wouldCollide no detecta colisión en bordes tocados (epsilon)", () => {
    const layout: import("./dashboard").Layout = [
      { i: "a", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
    ];
    expect(wouldCollide(0, 0.4, 0.5, 0.3, layout)).toBe(false);
    expect(wouldCollide(0.5, 0, 0.5, 0.4, layout)).toBe(false);
    expect(wouldCollide(0, 0, 0.5, 0.4, layout, "a")).toBe(false);
  });

  it("addWidget coloca con tamaño mínimo cuando default size no cabe en ningún lado", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([
      { i: "habits", xPercent: 0, yPercent: 0, wPercent: 1, hPercent: 0.8 },
    ]);
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    store.addWidget("goals");
    const item = store.layout.find((i) => i.i === "goals");
    expect(item).toBeDefined();
    expect(item!.wPercent).toBeCloseTo(1 / 12);
    expect(item!.hPercent).toBeCloseTo(1 / 10);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("addWidget loguea error si la grilla está completamente llena", async () => {
    const store = useDashboardStore();
    await flush();
    store.updateLayout([
      { i: "full", xPercent: 0, yPercent: 0, wPercent: 1, hPercent: 1 },
    ]);
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    store.addWidget("habits");
    const item = store.layout.find((i) => i.i === "habits");
    expect(item).toBeUndefined();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("No se pudo colocar"),
    );
    consoleSpy.mockRestore();
  });
});
