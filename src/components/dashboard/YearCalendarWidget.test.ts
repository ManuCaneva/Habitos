import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import YearCalendarWidget from "./YearCalendarWidget.vue";

const mockStore = {
  connected: false,
  currentYear: 2026,
  syncing: false,
  syncError: null,
  events: [],
  eventsByDate: new Map(),
  connect: vi.fn(),
  disconnect: vi.fn(),
  syncYear: vi.fn().mockResolvedValue(undefined),
  goNextYear: vi.fn(),
  goPrevYear: vi.fn(),
  loadPersistedConfig: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/stores/calendar", () => ({
  useCalendarStore: () => mockStore,
}));

describe("YearCalendarWidget", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockStore.currentYear = 2026;
    mockStore.connected = false;
    mockStore.eventsByDate = new Map();
    mockStore.syncError = null;
  });

  it("renderiza 12 meses", async () => {
    let resizeCallback: (() => void) | null = null;
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) {
        resizeCallback = callback;
      }
      observe() {}
      disconnect() {}
    });

    const wrapper = mount(YearCalendarWidget, { attachTo: document.body });
    const bodyEl = wrapper.find(".ycw__body").element as HTMLElement;
    Object.defineProperty(bodyEl, "clientWidth", { value: 1200, configurable: true });
    Object.defineProperty(bodyEl, "clientHeight", { value: 900, configurable: true });

    if (resizeCallback) {
      (resizeCallback as () => void)();
    }
    await wrapper.vm.$nextTick();

    const months = wrapper.findAll("[data-testid='month-mini']");
    expect(months).toHaveLength(12);

    vi.unstubAllGlobals();
  });

  it("llama syncYear al montarse", () => {
    mount(YearCalendarWidget);
    expect(mockStore.syncYear).toHaveBeenCalledWith(2026);
  });

  it("renderiza el año actual en el header", () => {
    const wrapper = mount(YearCalendarWidget);
    expect(wrapper.text()).toContain("2026");
  });

  it("goNextYear se llama al hacer click en next", () => {
    const wrapper = mount(YearCalendarWidget);
    wrapper.find("[data-testid='year-next']").trigger("click");
    expect(mockStore.goNextYear).toHaveBeenCalled();
  });

  it("goPrevYear se llama al hacer click en prev", () => {
    const wrapper = mount(YearCalendarWidget);
    wrapper.find("[data-testid='year-prev']").trigger("click");
    expect(mockStore.goPrevYear).toHaveBeenCalled();
  });

  it("no muestra indicador de sync si syncing=false", () => {
    const wrapper = mount(YearCalendarWidget);
    expect(wrapper.find("[data-testid='sync-spinner']").exists()).toBe(false);
  });

  it("muestra spinner si syncing=true", () => {
    mockStore.syncing = true;
    const wrapper = mount(YearCalendarWidget);
    expect(wrapper.find("[data-testid='sync-spinner']").exists()).toBe(true);
  });

  it("usa el componente Container (bg-surface-1 border-hairline)", () => {
    const wrapper = mount(YearCalendarWidget);
    const container = wrapper.find("[data-testid='year-calendar-widget']");
    expect(container.exists()).toBe(true);
    expect(container.classes()).toContain("bg-surface-1");
    expect(container.classes()).toContain("border-hairline");
  });

  it("cada mes tiene su nombre en el tooltip", () => {
    const wrapper = mount(YearCalendarWidget);
    const months = wrapper.findAll("[data-testid='month-mini']");
    for (const month of months) {
      expect(month.attributes("title")).toBeTruthy();
    }
  });

  it("muestra el título 'Calendario Anual' en el header", () => {
    const wrapper = mount(YearCalendarWidget);
    expect(wrapper.text()).toContain("Calendario Anual");
  });

  it("no muestra flechas de paginación cuando caben los 12 meses", () => {
    const wrapper = mount(YearCalendarWidget);
    expect(wrapper.find("[data-testid='month-up']").exists()).toBe(false);
    expect(wrapper.find("[data-testid='month-down']").exists()).toBe(false);
  });

  it("muestra flechas de paginación cuando no caben los 12 meses", async () => {
    let resizeCallback: (() => void) | null = null;
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) {
        resizeCallback = callback;
      }
      observe() {
        // Llamar al callback inmediatamente para simular el resize
        if (resizeCallback) {
          setTimeout(() => resizeCallback!(), 0);
        }
      }
      disconnect() {}
    });

    const wrapper = mount(YearCalendarWidget, { attachTo: document.body });
    const bodyEl = wrapper.find(".ycw__body").element as HTMLElement;
    Object.defineProperty(bodyEl, "clientWidth", { value: 300, configurable: true });
    Object.defineProperty(bodyEl, "clientHeight", { value: 300, configurable: true });

    // Esperar a que el callback del ResizeObserver se ejecute
    await new Promise(resolve => setTimeout(resolve, 10));
    await wrapper.vm.$nextTick();

    expect(wrapper.find("[data-testid='month-up']").exists()).toBe(true);
    expect(wrapper.find("[data-testid='month-down']").exists()).toBe(true);

    vi.unstubAllGlobals();
  });

  it("forces layout columns to match the dashboard item width", async () => {
    let resizeCallback: (() => void) | null = null;
    vi.stubGlobal("ResizeObserver", class {
      constructor(callback: () => void) {
        resizeCallback = callback;
      }
      observe() {
        if (resizeCallback) {
          setTimeout(() => resizeCallback!(), 0);
        }
      }
      disconnect() {}
    });

    const item = {
      i: "year-calendar",
      xPercent: 0,
      yPercent: 0.7,
      wPercent: 2 / 12, // 2 columns
      hPercent: 0.5,
    };

    const wrapper = mount(YearCalendarWidget, {
      props: { item },
      attachTo: document.body,
    });
    const bodyEl = wrapper.find(".ycw__body").element as HTMLElement;
    Object.defineProperty(bodyEl, "clientWidth", { value: 600, configurable: true });
    Object.defineProperty(bodyEl, "clientHeight", { value: 800, configurable: true });

    await new Promise(resolve => setTimeout(resolve, 10));
    await wrapper.vm.$nextTick();

    const grid = wrapper.find(".ycw__grid");
    expect(grid.attributes("style")).toContain("--cols: 2");

    vi.unstubAllGlobals();
  });
});
