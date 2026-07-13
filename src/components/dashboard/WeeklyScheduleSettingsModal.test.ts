import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, VueWrapper } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import WeeklyScheduleSettingsModal from "./WeeklyScheduleSettingsModal.vue";

const mockStore = {
  settings: {
    granularity_minutes: 30,
    day_start_minutes: 360,
    day_end_minutes: 1380,
    week_starts_monday: true,
  },
  saveSettings: vi.fn(),
};

vi.mock("@/stores/weeklySchedule", () => ({
  useWeeklyScheduleStore: () => mockStore,
  minutesToHHMM: (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  },
  hhmmToMinutes: (s: string) => {
    const [h, m] = s.split(":").map(Number);
    return h * 60 + m;
  },
}));

describe("WeeklyScheduleSettingsModal", () => {
  let wrapper: VueWrapper<any>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) wrapper.unmount();
    document.body.innerHTML = "";
  });

  it("renderiza el título de ajustes", () => {
    wrapper = mount(WeeklyScheduleSettingsModal, {
      props: { open: true },
      attachTo: document.body,
    });

    const dialog = document.body.querySelector("[role='dialog']");
    expect(dialog).not.toBeNull();
    expect(dialog!.textContent).toContain("Ajustes del cronograma");
  });

  it("llama a saveSettings al guardar con los nuevos valores", async () => {
    wrapper = mount(WeeklyScheduleSettingsModal, {
      props: { open: true },
      attachTo: document.body,
    });

    const buttons = Array.from(document.body.querySelectorAll("button"));
    const saveButton = buttons.find(b => b.textContent?.includes("Guardar"));
    expect(saveButton).toBeDefined();
    await saveButton!.click();

    expect(mockStore.saveSettings).toHaveBeenCalledTimes(1);
  });
});
