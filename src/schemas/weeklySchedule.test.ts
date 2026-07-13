import { describe, expect, it } from "vitest";
import {
  BLOCK_COLOR_TOKENS,
  blockColorSchema,
  ScheduleBlockSchema,
  rowToScheduleBlock,
  scheduleBlockToRow,
  WeeklyScheduleSettingsSchema,
  DEFAULT_WEEKLY_SCHEDULE_SETTINGS,
} from "./weeklySchedule";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";
const validIso = "2026-07-12T19:00:00.000Z";

describe("weeklySchedule schema tests", () => {
  describe("BLOCK_COLOR_TOKENS", () => {
    it("has valid color tokens", () => {
      expect(BLOCK_COLOR_TOKENS).toContain("lavender");
      expect(BLOCK_COLOR_TOKENS).toContain("green");
    });

    it("validates color schema", () => {
      expect(blockColorSchema.parse("lavender")).toBe("lavender");
      expect(() => blockColorSchema.parse("invalid-color")).toThrow();
    });
  });

  describe("ScheduleBlockSchema", () => {
    const validBlock = {
      id: validUuid,
      day_of_week: 1, // Martes
      start_minutes: 360, // 06:00
      end_minutes: 420, // 07:00
      title: "Gimnasio",
      color: "lavender",
      sort_order: 0,
      created_at: validIso,
      updated_at: validIso,
    };

    it("acepta un bloque válido", () => {
      expect(ScheduleBlockSchema.parse(validBlock)).toEqual(validBlock);
    });

    it("recorta espacios en el título", () => {
      const block = { ...validBlock, title: "  Gimnasio  " };
      expect(ScheduleBlockSchema.parse(block).title).toBe("Gimnasio");
    });

    it("rechaza título vacío", () => {
      const block = { ...validBlock, title: "" };
      expect(() => ScheduleBlockSchema.parse(block)).toThrow();
    });

    it("rechaza día de semana fuera de rango", () => {
      const block = { ...validBlock, day_of_week: 7 };
      expect(() => ScheduleBlockSchema.parse(block)).toThrow();
    });

    it("rechaza start_minutes fuera de rango", () => {
      const block = { ...validBlock, start_minutes: 1440 };
      expect(() => ScheduleBlockSchema.parse(block)).toThrow();
    });

    it("rechaza end_minutes fuera de rango", () => {
      const block = { ...validBlock, end_minutes: 1441 };
      expect(() => ScheduleBlockSchema.parse(block)).toThrow();
    });

    it("rechaza si end_minutes <= start_minutes", () => {
      const block = { ...validBlock, start_minutes: 420, end_minutes: 360 };
      expect(() => ScheduleBlockSchema.parse(block)).toThrow();
    });
  });

  describe("Mappers", () => {
    const validRow = {
      id: validUuid,
      day_of_week: 1,
      start_minutes: 360,
      end_minutes: 420,
      title: "Gimnasio",
      color: "lavender",
      sort_order: 0,
      created_at: validIso,
      updated_at: validIso,
    };

    const validBlock = {
      id: validUuid,
      day_of_week: 1,
      start_minutes: 360,
      end_minutes: 420,
      title: "Gimnasio",
      color: "lavender" as const,
      sort_order: 0,
      created_at: validIso,
      updated_at: validIso,
    };

    it("convierte fila a bloque de dominio", () => {
      expect(rowToScheduleBlock(validRow)).toEqual(validBlock);
    });

    it("convierte bloque de dominio a fila", () => {
      expect(scheduleBlockToRow(validBlock)).toEqual(validRow);
    });
  });

  describe("WeeklyScheduleSettingsSchema", () => {
    it("tiene valores por defecto correctos", () => {
      expect(DEFAULT_WEEKLY_SCHEDULE_SETTINGS).toEqual({
        granularity_minutes: 30,
        day_start_minutes: 360,
        day_end_minutes: 1380,
        week_starts_monday: true,
      });
    });

    it("acepta settings válidos", () => {
      const customSettings = {
        granularity_minutes: 15,
        day_start_minutes: 480,
        day_end_minutes: 1000,
        week_starts_monday: true,
      };
      expect(WeeklyScheduleSettingsSchema.parse(customSettings)).toEqual(customSettings);
    });

    it("rechaza granularidad inválida", () => {
      expect(() => WeeklyScheduleSettingsSchema.parse({
        granularity_minutes: 20,
        day_start_minutes: 360,
        day_end_minutes: 1380,
        week_starts_monday: true,
      })).toThrow();
    });
  });
});
