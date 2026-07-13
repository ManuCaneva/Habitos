import { toLocalDate, resolveEventColor, type CalendarEvent } from "@/schemas/calendar";

const BASE = "https://www.googleapis.com/calendar/v3";

export function buildEventsListUrl(
  calendarId: string,
  timeMin: string,
  timeMax: string,
): string {
  const url = new URL(`${BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("timeMin", timeMin);
  url.searchParams.set("timeMax", timeMax);
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  return url.toString();
}

export function buildCalendarListUrl(): string {
  return `${BASE}/users/me/calendarList`;
}

export function mapGcalEventsToDomain(
  items: Array<{
    id: string;
    summary?: string;
    start: { dateTime?: string; date?: string };
    end: { dateTime?: string; date?: string };
    colorId?: string;
    description?: string;
  }>,
  calendarId: string,
  calendarColor: string,
): CalendarEvent[] {
  return items.map((item) => {
    const date = toLocalDate(item.start.dateTime ?? item.start.date) ?? "";
    const color = resolveEventColor(item.colorId, calendarColor);
    return {
      id: item.id,
      date,
      title: item.summary ?? "",
      color,
      calendarId,
      start: item.start.dateTime ?? item.start.date ?? "",
      end: item.end.dateTime ?? item.end.date ?? "",
      description: item.description,
    };
  });
}

export function mapCalendarListToColors(
  calendars: Array<{ id: string; backgroundColor?: string }>,
): Map<string, string> {
  const map = new Map<string, string>();
  for (const cal of calendars) {
    if (cal.backgroundColor) {
      map.set(cal.id, cal.backgroundColor);
    }
  }
  return map;
}
