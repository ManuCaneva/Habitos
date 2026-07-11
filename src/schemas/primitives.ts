import { z } from "zod";

export const uuid = z.string().uuid();

export const isoTimestamp = z
  .string()
  .datetime({ offset: true })
  .describe("ISO 8601 UTC con offset, ej: 2026-06-27T14:30:00.000Z");

export const localDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "log_date debe ser YYYY-MM-DD")
  .refine((s) => !Number.isNaN(Date.parse(s + "T00:00:00")), "Fecha inválida");

export const hexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "color debe ser #RRGGBB");

export const trimmed = (min: number, max: number) =>
  z
    .string()
    .transform((s) => s.trim())
    .pipe(z.string().min(min).max(max));

export function normalizeTimestamp(ts: string): string {
  if (!ts) return ts;
  if (ts.includes("T")) return ts;
  const [date, time] = ts.split(" ");
  if (!date || !time) return ts;
  const hasTimezone = time.includes("Z") || time.includes("+") || time.includes("-", 6);
  return `${date}T${time}${hasTimezone ? "" : "Z"}`;
}
