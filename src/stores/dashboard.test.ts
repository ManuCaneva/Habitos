import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { ref, watch } from "vue";
import { useDashboardStore } from "./dashboard";

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

  it("carga el layout por defecto cuando no hay guardado", () => {
    const store = useDashboardStore();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].i).toBe("habits");
    expect(store.layout[0].w).toBe(12);
    expect(store.layout[0].h).toBe(10);
  });

  it("carga el layout guardado válido", () => {
    storage.set(
      "habitos-dashboard-layout",
      JSON.stringify([{ i: "habits", x: 2, y: 0, w: 5, h: 6 }]),
    );
    const store = useDashboardStore();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].x).toBe(2);
    expect(store.layout[0].w).toBe(5);
    expect(store.layout[0].h).toBe(6);
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
        { i: "habits", x: 0, y: 0, w: 4, h: 4 },
        { i: "", x: 0, y: 0, w: 1, h: 1 },
        { x: 0, y: 0, w: 1, h: 1 },
      ]),
    );
    const store = useDashboardStore();
    expect(store.layout).toHaveLength(1);
    expect(store.layout[0].i).toBe("habits");
  });

  it("persiste el layout al actualizar", () => {
    const store = useDashboardStore();
    store.updateLayout([{ i: "habits", x: 1, y: 0, w: 3, h: 6 }]);
    const raw = storage.get("habitos-dashboard-layout");
    expect(raw).toBeDefined();
    const parsed = JSON.parse(raw!);
    expect(parsed[0].x).toBe(1);
    expect(parsed[0].w).toBe(3);
  });

  it("moveTo actualiza posición y persiste", () => {
    const store = useDashboardStore();
    store.moveTo("habits", 3, 2);
    expect(store.layout[0].x).toBe(3);
    expect(store.layout[0].y).toBe(2);
    const raw = storage.get("habitos-dashboard-layout");
    expect(JSON.parse(raw!)[0].x).toBe(3);
  });

  it("resizeTo actualiza tamaño y persiste", () => {
    const store = useDashboardStore();
    store.resizeTo("habits", 6, 5);
    expect(store.layout[0].w).toBe(6);
    expect(store.layout[0].h).toBe(5);
    const raw = storage.get("habitos-dashboard-layout");
    expect(JSON.parse(raw!)[0].w).toBe(6);
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
    store.updateLayout([{ i: "habits", x: 4, y: 4, w: 2, h: 2 }]);
    store.resetLayout();
    expect(store.layout[0].x).toBe(0);
    expect(store.layout[0].w).toBe(12);
  });
});
