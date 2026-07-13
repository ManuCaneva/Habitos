import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import WeeklyScheduleBlock from "./WeeklyScheduleBlock.vue";

vi.mock("@/stores/weeklySchedule", () => ({
  useWeeklyScheduleStore: () => ({
    moveBlockAfterDrag: vi.fn(),
  }),
}));

describe("WeeklyScheduleBlock", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const validBlock = {
    id: "333e8400-e29b-41d4-a716-446655440000",
    day_of_week: 1,
    start_minutes: 360,
    end_minutes: 420,
    title: "Gimnasio",
    color: "lavender" as const,
    sort_order: 0,
    created_at: "2026-07-12T19:00:00.000Z",
    updated_at: "2026-07-12T19:00:00.000Z",
  };

  it("renderiza el bloque con el título y clase de color correspondiente", () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: {
        block: validBlock,
        minuteHeightPx: 1,
        dayStart: 360,
      },
    });

    expect(wrapper.text()).toContain("Gimnasio");
    expect((wrapper.element as HTMLElement).style.borderColor).toBe("#5e6ad2");
  });

  it("emite click cuando el usuario hace click en el bloque", async () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: {
        block: validBlock,
        minuteHeightPx: 1,
        dayStart: 360,
      },
    });

    await wrapper.find("button").trigger("click");
    expect(wrapper.emitted("click")).toBeTruthy();
  });
});
