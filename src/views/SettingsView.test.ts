import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import SettingsView from "./SettingsView.vue";

vi.mock("@/composables/useTheme", () => ({
  useTheme: () => ({
    isDark: true,
    setTheme: vi.fn(),
  }),
}));

const mockCalendarStore: {
  connected: boolean;
  syncError: string | null;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
} = {
  connected: false,
  syncError: null,
  connect: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
};

vi.mock("@/stores/calendar", () => ({
  useCalendarStore: () => mockCalendarStore,
}));

describe("SettingsView", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    mockCalendarStore.connected = false;
    mockCalendarStore.syncError = null;
  });

  it("main element has h-full and overflow-y-auto", () => {
    const wrapper = mount(SettingsView);
    const main = wrapper.find("main");
    expect(main.exists()).toBe(true);
    expect(main.classes()).toContain("h-full");
    expect(main.classes()).toContain("overflow-y-auto");
  });

  it("muestra la card de Google Calendar", () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.text()).toContain("Google Calendar");
  });

  it("muestra botón Conectar cuando no está conectado", () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find("[data-testid='gcal-connect-btn']").exists()).toBe(true);
  });

  it("llama store.connect al hacer click en Conectar", async () => {
    const wrapper = mount(SettingsView);
    await wrapper.find("[data-testid='gcal-connect-btn']").trigger("click");
    expect(mockCalendarStore.connect).toHaveBeenCalled();
  });

  it("muestra Conectado + Desconectar cuando conectado", () => {
    mockCalendarStore.connected = true;
    const wrapper = mount(SettingsView);
    expect(wrapper.text()).toContain("Connected");
    expect(wrapper.text()).toContain("Desconectar");
    expect(wrapper.find("[data-testid='gcal-connect-btn']").exists()).toBe(false);
  });

  it("llama store.disconnect al hacer click en Desconectar", async () => {
    mockCalendarStore.connected = true;
    const wrapper = mount(SettingsView);
    await wrapper.find("[data-testid='gcal-disconnect-btn']").trigger("click");
    expect(mockCalendarStore.disconnect).toHaveBeenCalled();
  });

  it("muestra error de sync si existe", () => {
    mockCalendarStore.syncError = "Token expired";
    const wrapper = mount(SettingsView);
    expect(wrapper.text()).toContain("Token expired");
  });
});
