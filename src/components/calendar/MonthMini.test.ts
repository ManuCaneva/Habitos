import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import MonthMini from "./MonthMini.vue";
import type { CalendarEvent } from "@/schemas/calendar";

const dummyEvents: CalendarEvent[] = [
  {
    id: "e1",
    date: "2026-01-15",
    title: "Standup",
    color: "#7986cb",
    calendarId: "primary",
    start: "2026-01-15T10:00:00Z",
    end: "2026-01-15T10:30:00Z",
  },
  {
    id: "e2",
    date: "2026-01-15",
    title: "Review",
    color: "#33b679",
    calendarId: "primary",
    start: "2026-01-15T14:00:00Z",
    end: "2026-01-15T15:00:00Z",
  },
];

const eventsByDate = new Map<string, CalendarEvent[]>();
eventsByDate.set("2026-01-15", dummyEvents);

describe("MonthMini", () => {
  it("renderiza 42 celdas (6 semanas × 7 días), pero solo las reales tienen data-testid", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate },
    });
    const allCells = wrapper.findAll(".day-cell");
    expect(allCells).toHaveLength(42);
    const realDays = wrapper.findAll("[data-testid='day-cell']");
    expect(realDays.length).toBe(31); // enero tiene 31 días
  });

  it("no muestra el nombre del mes en el tooltip principal", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate, monthName: "enero" },
    });
    const monthEl = wrapper.find("[data-testid='month-mini']");
    expect(monthEl.attributes("title")).toBeUndefined();
  });

  it("muestra el día exacto formateado en el tooltip de la celda de día", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate },
    });
    const cells = wrapper.findAll("[data-testid='day-cell']");
    const cell15 = cells[14]; // 15 de Enero
    expect(cell15.attributes("title")).toBe("15 de Enero");
  });

  it("emite select-day al hacer clic en una celda con fecha", async () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate },
    });
    const cells = wrapper.findAll("[data-testid='day-cell']");
    const cell15 = cells[14];
    await cell15.trigger("click");
    expect(wrapper.emitted("select-day")).toBeTruthy();
    expect(wrapper.emitted("select-day")![0]).toEqual(["2026-01-15"]);
  });

  it("renderiza el nombre del mes como texto cuando se pasa monthName", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate, monthName: "enero" },
    });
    expect(wrapper.find(".month-mini__name").text()).toBe("enero");
  });

  it("no muestra header D-L-M-M-J-V-S por defecto", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate },
    });
    expect(wrapper.findAll("[data-testid='day-header']").length).toBe(0);
  });

  it("muestra header D-L-M-M-J-V-S cuando showHeader=true", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate, showHeader: true },
    });
    const headers = wrapper.findAll("[data-testid='day-header']");
    expect(headers).toHaveLength(7);
    expect(headers[0].text()).toBe("D");
    expect(headers[6].text()).toBe("S");
  });

  it("muestra cuadrados con dots de color para días con eventos", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate },
    });
    const dots = wrapper.findAll("[data-testid='event-dot']");
    expect(dots).toHaveLength(2);
    expect(dots[0].attributes("style")).toContain("#7986cb");
    expect(dots[1].attributes("style")).toContain("#33b679");
  });

  it("celdas sin eventos muestran cuadrado vacío", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate },
    });
    const cells = wrapper.findAll("[data-testid='day-cell']");
    const cellsWithDots = cells.filter(
      (c) => c.findAll("[data-testid='event-dot']").length > 0,
    );
    expect(cellsWithDots.length).toBe(1);
    expect(cells.length - cellsWithDots.length).toBe(30);
  });

  it("celdas padding (fuera del mes) tienen clase day-cell--empty", () => {
    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate },
    });
    const emptyCells = wrapper.findAll(".day-cell--empty");
    expect(emptyCells.length).toBe(11); // 42 - 31 = 11 celdas vacías
  });

  it("muestra hasta 4 dots y +N cuando hay más de 4 eventos en un día", () => {
    const manyEvents: CalendarEvent[] = Array.from({ length: 6 }, (_, i) => ({
      id: `e${i}`,
      date: "2026-01-20",
      title: `Event ${i}`,
      color: "#e67c73",
      calendarId: "primary",
      start: `2026-01-20T${i + 9}:00:00Z`,
      end: `2026-01-20T${i + 10}:00:00Z`,
    }));
    const map = new Map<string, CalendarEvent[]>();
    map.set("2026-01-20", manyEvents);

    const wrapper = mount(MonthMini, {
      props: { year: 2026, month: 0, eventsByDate: map },
    });
    const dots = wrapper.findAll("[data-testid='event-dot']");
    expect(dots).toHaveLength(4);
    expect(wrapper.text()).toContain("+2");
  });
});
