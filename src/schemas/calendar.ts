import { z } from "zod";
import { hexColor } from "./primitives";

export const CalendarEventSchema = z.object({
  id: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string(),
  color: hexColor,
  calendarId: z.string(),
  start: z.string(),
  end: z.string(),
  description: z.string().optional(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const CalendarConfigSchema = z.object({
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  tokenExpiry: z.string().nullable(),
  connected: z.boolean(),
});

export type CalendarConfig = z.infer<typeof CalendarConfigSchema>;

const GcalDateTimeSchema = z.object({
  dateTime: z.string().optional(),
  date: z.string().optional(),
});

const GcalEventItemSchema = z.object({
  id: z.string(),
  summary: z.string().optional().default(""),
  start: GcalDateTimeSchema,
  end: GcalDateTimeSchema,
  colorId: z.string().optional(),
  description: z.string().optional(),
});

export const GcalEventApiResponseSchema = z.object({
  items: z.array(GcalEventItemSchema).optional().default([]),
});

export type GcalEventApiResponse = z.infer<typeof GcalEventApiResponseSchema>;

export const CALENDAR_COLORS: Record<string, string> = {
  "1": "#7986cb",
  "2": "#33b679",
  "3": "#8e24aa",
  "4": "#e67c73",
  "5": "#f6bf26",
  "6": "#f5511d",
  "7": "#039be5",
  "8": "#616161",
  "9": "#3f51b5",
  "10": "#0b8043",
  "11": "#c0c0c0",
};

export function toLocalDate(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  } catch {
    return null;
  }
}

export function resolveEventColor(
  colorId: string | undefined,
  calendarColor: string | undefined,
): string {
  if (colorId && CALENDAR_COLORS[colorId]) return CALENDAR_COLORS[colorId];
  return calendarColor ?? "#5e6ad2";
}
