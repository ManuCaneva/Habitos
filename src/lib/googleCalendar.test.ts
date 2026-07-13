import { describe, it, expect } from "vitest";
import {
  buildEventsListUrl,
  buildCalendarListUrl,
  mapGcalEventsToDomain,
  mapCalendarListToColors,
} from "./googleCalendar";

describe("googleCalendar", () => {
  describe("buildEventsListUrl", () => {
    it("construye URL con timeMin y timeMax", () => {
      const url = buildEventsListUrl("primary", "2026-01-01T00:00:00Z", "2027-01-01T00:00:00Z");
      expect(url).toContain("/calendars/primary/events");
      expect(url).toContain("timeMin=2026-01-01T00%3A00%3A00Z");
      expect(url).toContain("timeMax=2027-01-01T00%3A00%3A00Z");
      expect(url).toContain("singleEvents=true");
      expect(url).toContain("orderBy=startTime");
    });
  });

  describe("buildCalendarListUrl", () => {
    it("construye URL para listar calendarios", () => {
      const url = buildCalendarListUrl();
      expect(url).toContain("/users/me/calendarList");
    });
  });

  describe("buildEventCreateUrl", () => {
    it("construye URL para crear evento", () => {
      const url = buildEventsListUrl("primary", "", "").split("?")[0]; // Base URL of events
      expect(url).toBe("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    });
  });

  describe("mapGcalEventsToDomain", () => {
    it("mapea items a CalendarEvent[]", () => {
      const items = [
        {
          id: "evt1",
          summary: "Reunión",
          start: { dateTime: "2026-01-15T10:00:00-03:00" },
          end: { dateTime: "2026-01-15T11:00:00-03:00" },
          colorId: "1",
          description: "Test description",
        },
        {
          id: "evt2",
          summary: "Todo el día",
          start: { date: "2026-01-20" },
          end: { date: "2026-01-21" },
        },
      ];

      const events = mapGcalEventsToDomain(items, "primary", "#5e6ad2");

      expect(events).toHaveLength(2);
      expect(events[0].date).toBe("2026-01-15");
      expect(events[0].title).toBe("Reunión");
      expect(events[0].color).toBe("#7986cb");
      expect(events[0].calendarId).toBe("primary");
      expect(events[0].description).toBe("Test description");

      expect(events[1].date).toBe("2026-01-20");
      expect(events[1].title).toBe("Todo el día");
      expect(events[1].color).toBe("#5e6ad2");
      expect(events[1].description).toBeUndefined();
    });

    it("usa el color del calendario si no hay colorId", () => {
      const items = [
        {
          id: "evt3",
          summary: "Sin color",
          start: { dateTime: "2026-02-01T09:00:00Z" },
          end: { dateTime: "2026-02-01T10:00:00Z" },
        },
      ];

      const events = mapGcalEventsToDomain(items, "secondary", "#33b679");
      expect(events[0].color).toBe("#33b679");
    });

    it("retorna array vacío para items vacío", () => {
      expect(mapGcalEventsToDomain([], "primary", "#5e6ad2")).toHaveLength(0);
    });
  });

  describe("mapCalendarListToColors", () => {
    it("mapea lista de calendarios a map id → backgroundColor", () => {
      const calendars = [
        { id: "primary", backgroundColor: "#7986cb" },
        { id: "secondary", backgroundColor: "#33b679" },
      ];

      const map = mapCalendarListToColors(calendars);
      expect(map.get("primary")).toBe("#7986cb");
      expect(map.get("secondary")).toBe("#33b679");
    });
  });
});
