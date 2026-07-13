import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import WeeklyScheduleGrid from "./WeeklyScheduleGrid.vue";

const mockStore = {
  blocks: [
    {
      id: "333e8400-e29b-41d4-a716-446655440000",
      day_of_week: 1,
      start_minutes: 360,
      end_minutes: 420,
      title: "Gimnasio",
      color: "primary",
      sort_order: 0,
      created_at: "2026-07-12T19:00:00.000Z",
      updated_at: "2026-07-12T19:00:00.000Z",
    },
  ],
  settings: {
    granularity_minutes: 30,
    day_start_minutes: 360,
    day_end_minutes: 1380,
    week_starts_monday: true,
  },
};

vi.mock("@/stores/weeklySchedule", () => ({
  useWeeklyScheduleStore: () => mockStore,
  minutesToHHMM: (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  },
}));

vi.mock("@/stores/ui", () => ({
  useUiStore: () => ({
    editMode: false,
  }),
}));

describe("WeeklyScheduleGrid", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("renderiza las columnas de los días de la semana", () => {
    const wrapper = mount(WeeklyScheduleGrid);
    expect(wrapper.text()).toContain("Lun");
    expect(wrapper.text()).toContain("Dom");
  });
});
