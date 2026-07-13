import { describe, it, expect } from "vitest";
import {
  CalendarEventSchema,
  CalendarConfigSchema,
  GcalEventApiResponseSchema,
  type CalendarEvent,
  type CalendarConfig,
} from "./calendar";

describe("CalendarEventSchema", () => {
  it("acepta un evento válido", () => {
    const event: CalendarEvent = {
      id: "evt123",
      date: "2026-01-15",
      title: "Team standup",
      color: "#7986cb",
      calendarId: "primary",
      start: "2026-01-15T10:00:00-03:00",
      end: "2026-01-15T10:30:00-03:00",
    };
    const result = CalendarEventSchema.parse(event);
    expect(result.id).toBe("evt123");
    expect(result.date).toBe("2026-01-15");
  });

  it("rechaza date con formato incorrecto", () => {
    expect(() =>
      CalendarEventSchema.parse({
        id: "evt1",
        date: "15-01-2026",
        title: "Test",
        color: "#7986cb",
        calendarId: "primary",
        start: "2026-01-15T10:00:00Z",
        end: "2026-01-15T10:30:00Z",
      }),
    ).toThrow();
  });
});

describe("CalendarConfigSchema", () => {
  it("acepta una config completa", () => {
    const config: CalendarConfig = {
      accessToken: "ya29.a0AfH6...",
      refreshToken: "1//0g...",
      tokenExpiry: "2026-07-11T19:00:00.000Z",
      connected: true,
    };
    const result = CalendarConfigSchema.parse(config);
    expect(result.connected).toBe(true);
    expect(result.accessToken).toBe("ya29.a0AfH6...");
  });

  it("acepta una config vacía (desconectada)", () => {
    const config: CalendarConfig = {
      accessToken: null,
      refreshToken: null,
      tokenExpiry: null,
      connected: false,
    };
    const result = CalendarConfigSchema.parse(config);
    expect(result.connected).toBe(false);
  });
});

describe("GcalEventApiResponseSchema", () => {
  const apiResponse = {
    items: [
      {
        id: "evt1",
        summary: "Reunión",
        start: { dateTime: "2026-01-15T10:00:00-03:00" },
        end: { dateTime: "2026-01-15T11:00:00-03:00" },
        colorId: "1",
      },
      {
        id: "evt2",
        summary: "Feriado",
        start: { date: "2026-01-01" },
        end: { date: "2026-01-02" },
      },
    ],
  };

  it("parsea una respuesta típica de Google Calendar API", () => {
    const result = GcalEventApiResponseSchema.parse(apiResponse);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].id).toBe("evt1");
    expect(result.items[0].summary).toBe("Reunión");
    expect(result.items[1].id).toBe("evt2");
  });

  it("tolera items sin colorId", () => {
    const result = GcalEventApiResponseSchema.parse(apiResponse);
    expect(result.items[0].colorId).toBe("1");
    expect(result.items[1].colorId).toBeUndefined();
  });
});
