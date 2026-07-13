import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { computed, ref } from "vue";
import SettingsView from "./SettingsView.vue";

const mockTheme = {
  id: "dark",
  name: "Oscuro",
  colors: {
    canvas: "1 1 2",
    surface1: "14 15 18",
    surface2: "24 25 30",
    surface3: "34 35 42",
    surface4: "44 45 53",
    hairline: "35 37 42",
    hairlineStrong: "57 59 66",
    hairlineTertiary: "74 77 86",
    ink: "247 248 248",
    inkMuted: "208 214 224",
    inkSubtle: "138 143 152",
    inkTertiary: "98 102 109",
    primary: "94 106 210",
    primaryHover: "130 143 255",
    primaryFocus: "94 105 209",
    brandSecure: "122 127 173",
    success: "39 166 68",
    overlay: "0 0 0",
  },
  fonts: {
    sans: ["Inter", "sans-serif"],
    mono: ["JetBrains Mono", "monospace"],
  },
};

const mockSetTheme = vi.fn();
const currentIdRef = ref("dark");
const currentComputed = computed(() => mockTheme);

vi.mock("@/composables/useTheme", () => ({
  useTheme: () => ({
    current: currentComputed,
    currentId: currentIdRef,
    themes: [
      {
        id: "dark",
        name: "Oscuro",
        colors: { primary: "94 106 210" },
      },
      {
        id: "light",
        name: "Claro",
        colors: { primary: "94 106 210" },
      },
    ],
    setTheme: mockSetTheme,
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

  it("el main tiene h-full y overflow-y-auto", () => {
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

  it("muestra el nombre del tema actual en el dropdown", () => {
    const wrapper = mount(SettingsView);
    const dropdown = wrapper.find("[data-testid='theme-dropdown-btn']");
    expect(dropdown.text()).toContain("Oscuro");
  });

  it("muestra el boton Conectar cuando no esta conectado", () => {
    const wrapper = mount(SettingsView);
    expect(wrapper.find("[data-testid='gcal-connect-btn']").exists()).toBe(true);
  });

  it("llama store.connect al hacer click en Conectar", async () => {
    const wrapper = mount(SettingsView);
    await wrapper.find("[data-testid='gcal-connect-btn']").trigger("click");
    expect(mockCalendarStore.connect).toHaveBeenCalled();
  });

  it("muestra Conectado y Desconectar cuando esta conectado", () => {
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
