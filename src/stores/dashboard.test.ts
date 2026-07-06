import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { ref, watch } from "vue";
import { useDashboardStore, findFreePosition, wouldCollide } from "./dashboard";

const storage = new Map<string, string>();

function createMockStorageRef<T>(key: string, defaultValue: T) {
  const raw = storage.get(key);
  const initial = raw !== undefined ? (JSON.parse(raw) as T) : defaultValue;
  const r = ref<T>(initial);
  watch(
    r,
    (v) => {
      if (v === null) storage.delete(key);
      else storage.set(key, JSON.stringify(v));
    },
    { deep: true, flush: "sync" },
  );
  return r;
}

vi.mock("@vueuse/core", async () => {
  const actual = await vi.importActual<typeof import("@vueuse/core")>("@vueuse/core");
  return {
    ...actual,
    useStorage: vi.fn(createMockStorageRef),
  };
});

describe("dashboard store", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    storage.clear();
  });

  it("carga el layout por defecto con porcentajes", () => {
    const store = useDashboardStore();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].i).toBe("habits");
    expect(store.layout[0].wPercent).toBeCloseTo(0.5);
    expect(store.layout[0].hPercent).toBeCloseTo(0.4);
  });

  it("carga layout guardado válido con porcentajes", () => {
    storage.set(
      "habitos-dashboard-layout",
      JSON.stringify([{ i: "habits", xPercent: 0.1, yPercent: 0, wPercent: 0.4, hPercent: 0.5 }]),
    );
    const store = useDashboardStore();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].xPercent).toBeCloseTo(0.1);
    expect(store.layout[0].wPercent).toBeCloseTo(0.4);
  });

  it("migra layout viejo (w/h) a porcentajes", () => {
    storage.set(
      "habitos-dashboard-layout",
      JSON.stringify([{ i: "habits", x: 0, y: 0, w: 6, h: 4 }]),
    );
    const store = useDashboardStore();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].wPercent).toBeCloseTo(0.5);
    expect(store.layout[0].hPercent).toBeCloseTo(0.4);
  });

  it("ignora layout inválido y usa default", () => {
    storage.set("habitos-dashboard-layout", JSON.stringify("not-an-array"));
    const store = useDashboardStore();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].i).toBe("habits");
  });

  it("filtra items inválidos del layout guardado", () => {
    storage.set(
      "habitos-dashboard-layout",
      JSON.stringify([
        { i: "habits", xPercent: 0, yPercent: 0, wPercent: 0.3, hPercent: 0.3 },
        { i: "", xPercent: 0, yPercent: 0, wPercent: 0.1, hPercent: 0.1 },
        { xPercent: 0, yPercent: 0, wPercent: 0.1, hPercent: 0.1 },
      ]),
    );
    const store = useDashboardStore();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].i).toBe("habits");
  });

  it("persiste el layout al actualizar", () => {
    const store = useDashboardStore();
    store.updateLayout([{ i: "habits", xPercent: 0.1, yPercent: 0, wPercent: 0.3, hPercent: 0.5 }]);
    const raw = storage.get("habitos-dashboard-layout");
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].wPercent).toBeCloseTo(0.3);
  });

  it("moveTo actualiza posición (porcentajes) y persiste", () => {
    const store = useDashboardStore();
    store.moveTo("habits", 0.3, 0.2);
    expect(store.layout[0].xPercent).toBeCloseTo(0.3);
    expect(store.layout[0].yPercent).toBeCloseTo(0.2);
    const raw = storage.get("habitos-dashboard-layout");
    expect(JSON.parse(raw!)[0].xPercent).toBeCloseTo(0.3);
  });

  it("resizeTo actualiza tamaño (porcentajes) y persiste", () => {
    const store = useDashboardStore();
    store.resizeTo("habits", 0.6, 0.5);
    expect(store.layout[0].wPercent).toBeCloseTo(0.6);
    expect(store.layout[0].hPercent).toBeCloseTo(0.5);
    const raw = storage.get("habitos-dashboard-layout");
    expect(JSON.parse(raw!)[0].wPercent).toBeCloseTo(0.6);
  });

  it("moveTo crea nuevo objeto item (no muta el anterior)", () => {
    const store = useDashboardStore();
    const oldItem = store.layout[0];
    store.moveTo("habits", 0.3, 0.2);
    const newItem = store.layout[0];
    expect(newItem).not.toBe(oldItem);
    expect(newItem.xPercent).toBeCloseTo(0.3);
  });

  it("resizeTo crea nuevo objeto item (no muta el anterior)", () => {
    const store = useDashboardStore();
    const oldItem = store.layout[0];
    store.resizeTo("habits", 0.8, 0.6);
    const newItem = store.layout[0];
    expect(newItem).not.toBe(oldItem);
    expect(newItem.wPercent).toBeCloseTo(0.8);
  });

  it("el item original no se muta tras moveTo", () => {
    const store = useDashboardStore();
    const oldItem = store.layout[0];
    const oldX = oldItem.xPercent;
    store.moveTo("habits", 0.9, 0.5);
    expect(oldItem.xPercent).toBe(oldX);
  });

  it("el item original no se muta tras resizeTo", () => {
    const store = useDashboardStore();
    const oldItem = store.layout[0];
    const oldW = oldItem.wPercent;
    store.resizeTo("habits", 0.9, 0.7);
    expect(oldItem.wPercent).toBe(oldW);
  });

  it("no agrega un widget duplicado", () => {
    const store = useDashboardStore();
    store.addWidget("habits");
    expect(store.layout).toHaveLength(1);
  });

  it("elimina un widget del layout", () => {
    const store = useDashboardStore();
    store.removeWidget("habits");
    expect(store.layout).toHaveLength(0);
  });

  it("resetea al layout por defecto", () => {
    const store = useDashboardStore();
    store.updateLayout([{ i: "habits", xPercent: 0.4, yPercent: 0.4, wPercent: 0.2, hPercent: 0.2 }]);
    store.resetLayout();
    expect(store.layout[0].xPercent).toBe(0);
    expect(store.layout[0].wPercent).toBeCloseTo(0.5);
  });

  it("moveTo rechaza si colisiona con otro widget", () => {
    const store = useDashboardStore();
    store.updateLayout([
      { i: "a", xPercent: 0, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
      { i: "b", xPercent: 0.5, yPercent: 0, wPercent: 0.5, hPercent: 0.4 },
    ]);
    const beforeX = store.layout.find((i) => i.i === "b")!.xPercent;
    store.moveTo("b", 0, 0);
    const afterX = store.layout.find((i) => i.i === "b")!.xPercent;
    expect(afterX).toBe(beforeX);
  });

  it("resizeTo rechaza si el nuevo tamaño colisiona con otro widget", () => {
    const store = useDashboardStore();
    // Setup: a en (0.4, 0) con w=0.3 (llega hasta 0.7), b en (0, 0) con w=0.3
    // Intentar resizeTo("b", 0.6, 0.3) → b llegaría hasta 0.6, colisiona con a (0.4-0.7)
    store.updateLayout([
      { i: "a", xPercent: 0.4, yPercent: 0, wPercent: 0.3, hPercent: 0.3 },
      { i: "b", xPercent: 0, yPercent: 0, wPercent: 0.3, hPercent: 0.3 },
    ]);
    const beforeW = store.layout.find((i) => i.i === "b")!.wPercent;
    store.resizeTo("b", 0.6, 0.3);
    const afterW = store.layout.find((i) => i.i === "b")!.wPercent;
    expect(afterW).toBe(beforeW);
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
});
