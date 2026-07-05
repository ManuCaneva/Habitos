import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, h, ref, nextTick, type Ref } from "vue";
import { mount } from "@vue/test-utils";
import { useHeatmapCols } from "./useHeatmapCols";

let resizeCallbacks: (() => void)[] = [];

function mockResizeObserver() {
  resizeCallbacks = [];
  class MockResizeObserver {
    constructor(cb: () => void) {
      resizeCallbacks.push(cb);
    }
    observe = vi.fn();
    disconnect = vi.fn();
  }
  globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
  return {
    triggerResize: () => {
      resizeCallbacks.forEach((cb) => cb());
    },
  };
}

function createTestComponent(width: number, options: Omit<Parameters<typeof useHeatmapCols>[0], "containerRef">) {
  const el = document.createElement("div");
  Object.defineProperty(el, "clientWidth", {
    get: () => width,
    configurable: true,
  });
  document.body.appendChild(el);

  let colsRef: Ref<number> | undefined;
  let sizeRef: Ref<number> | undefined;

  mount(
    defineComponent({
      setup() {
        const containerRef = ref<HTMLElement | null>(el);
        const result = useHeatmapCols({ ...options, containerRef });
        colsRef = result.cols;
        sizeRef = result.actualCellSize;
        return () => h("div");
      },
    })
  );

  return {
    get cols() { return colsRef?.value; },
    get actualCellSize() { return sizeRef?.value; },
  };
}

describe("useHeatmapCols", () => {
  beforeEach(() => {
    mockResizeObserver();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("con ancho amplio: mantiene 52 cols y cellSize 10", async () => {
    const vm = createTestComponent(700, { dataCols: 52, cellSize: 10, gap: 2 });
    await nextTick();
    expect(vm.cols).toBe(52);
    expect(vm.actualCellSize).toBe(10);
  });

  it("con ancho insuficiente: reduce cols en lugar de cellSize", async () => {
    const vm = createTestComponent(200, { dataCols: 52, cellSize: 10, gap: 2 });
    await nextTick();
    expect(vm.cols).toBeLessThan(52);
    expect(vm.cols).toBeGreaterThan(0);
    expect(vm.actualCellSize).toBe(10);
  });

  it("cols nunca excede dataCols (aunque sobre ancho)", async () => {
    const vm = createTestComponent(5000, { dataCols: 52, cellSize: 10, gap: 2 });
    await nextTick();
    expect(vm.cols).toBe(52);
  });

  it("con ancho insuficiente para 1 col a 10px: reduce cellSize al mínimo", async () => {
    const vm = createTestComponent(5, {
      dataCols: 52,
      cellSize: 10,
      minCellSize: 6,
      maxCellSize: 12,
      gap: 2,
    });
    await nextTick();
    expect(vm.actualCellSize).toBeLessThan(10);
    expect(vm.cols).toBeGreaterThan(0);
  });
});
