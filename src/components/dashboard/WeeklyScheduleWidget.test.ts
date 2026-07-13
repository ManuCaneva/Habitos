import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import WeeklyScheduleWidget from "./WeeklyScheduleWidget.vue";

vi.mock("@/stores/weeklySchedule", () => ({
  useWeeklyScheduleStore: () => ({
    blocks: [],
    settings: {
      granularity_minutes: 30,
      day_start_minutes: 360,
      day_end_minutes: 1380,
      week_starts_monday: true,
    },
    loading: false,
    lastError: null,
    blocksByDay: new Map(),
    loadAll: vi.fn(),
  }),
  minutesToHHMM: (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  },
  BLOCK_COLOR_TOKENS: ["lavender", "green"] as const,
}));

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    editMode: false,
  }),
}));

describe("WeeklyScheduleWidget", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renderiza el widget de cronograma semanal", () => {
    const wrapper = mount(WeeklyScheduleWidget);
    expect(wrapper.find("[data-testid='weekly-schedule-widget']").exists()).toBe(true);
    expect(wrapper.text()).toContain("Cronograma Semanal");
  });
});
