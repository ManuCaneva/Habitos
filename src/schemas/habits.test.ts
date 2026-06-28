import { describe, expect, it } from "vitest";
import {
  CreateHabitDraftSchema,
  CreateHabitLogDraftSchema,
  FrequencyTypeSchema,
  HabitFrequencySchema,
  HabitLogSchema,
  HabitLogRowSchema,
  HabitRowSchema,
  HabitSchema,
  habitToRow,
  rowToHabit,
  rowToHabitLog,
  UpdateHabitDraftSchema,
} from "./habits";

const validUuid = "550e8400-e29b-41d4-a716-446655440000";
const validIso = "2026-06-27T10:00:00.000Z";
const validDate = "2026-06-27";

const baseDaily = {
  type: "daily" as const,
  target_per_period: 1,
};

describe("HabitFrequencySchema", () => {
  it("acepta una frecuencia diaria", () => {
    expect(HabitFrequencySchema.parse(baseDaily)).toEqual(baseDaily);
  });

  it("acepta una frecuencia semanal", () => {
    expect(
      HabitFrequencySchema.parse({ type: "weekly", target_per_period: 3 }),
    ).toEqual({ type: "weekly", target_per_period: 3 });
  });

  it("acepta una frecuencia con intervalo", () => {
    expect(
      HabitFrequencySchema.parse({
        type: "interval",
        target_per_period: 1,
        interval_days: 3,
      }),
    ).toEqual({ type: "interval", target_per_period: 1, interval_days: 3 });
  });

  it("rechaza intervalo sin interval_days", () => {
    expect(() =>
      HabitFrequencySchema.parse({ type: "interval", target_per_period: 1 }),
    ).toThrow();
  });

  it("rechaza interval_days fuera de rango", () => {
    expect(() =>
      HabitFrequencySchema.parse({
        type: "interval",
        interval_days: 0,
      }),
    ).toThrow();
    expect(() =>
      HabitFrequencySchema.parse({
        type: "interval",
        interval_days: 400,
      }),
    ).toThrow();
  });

  it("rechaza type desconocido", () => {
    expect(() =>
      HabitFrequencySchema.parse({ type: "mensual", target_per_period: 1 }),
    ).toThrow();
  });
});

describe("FrequencyTypeSchema", () => {
  it("acepta los 3 tipos válidos", () => {
    expect(FrequencyTypeSchema.parse("daily")).toBe("daily");
    expect(FrequencyTypeSchema.parse("weekly")).toBe("weekly");
    expect(FrequencyTypeSchema.parse("interval")).toBe("interval");
  });

  it("rechaza otros valores", () => {
    expect(() => FrequencyTypeSchema.parse("monthly")).toThrow();
  });
});

describe("HabitSchema", () => {
  const validHabit = {
    id: validUuid,
    name: "Leer 20 minutos",
    description: null,
    icon: null,
    color: "#5e6ad2",
    frequency: baseDaily,
    sort_order: 0,
    created_at: validIso,
    updated_at: validIso,
    archived_at: null,
  };

  it("acepta un hábito diario válido", () => {
    expect(HabitSchema.parse(validHabit)).toMatchObject({ name: "Leer 20 minutos" });
  });

  it("rechaza color con formato inválido", () => {
    expect(() => HabitSchema.parse({ ...validHabit, color: "red" })).toThrow();
    expect(() => HabitSchema.parse({ ...validHabit, color: "#fff" })).toThrow();
  });

  it("rechaza nombre vacío", () => {
    expect(() => HabitSchema.parse({ ...validHabit, name: "   " })).toThrow();
  });

  it("rechaza nombre de más de 100 caracteres", () => {
    expect(() => HabitSchema.parse({ ...validHabit, name: "a".repeat(101) })).toThrow();
  });

  it("rechaza id que no es uuid", () => {
    expect(() => HabitSchema.parse({ ...validHabit, id: "abc" })).toThrow();
  });

  it("rechaza timestamp sin offset", () => {
    expect(() =>
      HabitSchema.parse({ ...validHabit, created_at: "2026-06-27T10:00:00" }),
    ).toThrow();
  });
});

describe("HabitLogSchema", () => {
  const validLog = {
    id: validUuid,
    habit_id: validUuid,
    log_date: validDate,
    completed_at: validIso,
    note: null,
    created_at: validIso,
  };

  it("acepta un log válido", () => {
    expect(HabitLogSchema.parse(validLog)).toMatchObject({ log_date: validDate });
  });

  it("rechaza log_date con formato incorrecto", () => {
    expect(() =>
      HabitLogSchema.parse({ ...validLog, log_date: "27-06-2026" }),
    ).toThrow();
  });

  it("rechaza log_date con fecha inválida", () => {
    expect(() =>
      HabitLogSchema.parse({ ...validLog, log_date: "2026-13-40" }),
    ).toThrow();
  });

  it("rechaza note de más de 280 caracteres", () => {
    expect(() =>
      HabitLogSchema.parse({ ...validLog, note: "x".repeat(281) }),
    ).toThrow();
  });
});

describe("CreateHabitDraftSchema", () => {
  it("acepta un draft mínimo (solo requeridos)", () => {
    const draft = {
      name: "Meditar",
      color: "#4cb782",
      frequency: baseDaily,
    };
    expect(CreateHabitDraftSchema.parse(draft)).toMatchObject({
      name: "Meditar",
      color: "#4cb782",
    });
  });

  it("rechaza un draft sin color", () => {
    expect(() =>
      CreateHabitDraftSchema.parse({ name: "X", frequency: baseDaily }),
    ).toThrow();
  });
});

describe("UpdateHabitDraftSchema", () => {
  it("acepta un patch parcial", () => {
    const patch = { name: "Nuevo nombre" };
    expect(UpdateHabitDraftSchema.parse(patch)).toEqual(patch);
  });

  it("acepta un patch vacío (no-op)", () => {
    expect(UpdateHabitDraftSchema.parse({})).toEqual({});
  });
});

describe("CreateHabitLogDraftSchema", () => {
  it("acepta un log draft sin log_date (lo calcula el store)", () => {
    expect(
      CreateHabitLogDraftSchema.parse({ habit_id: validUuid }),
    ).toMatchObject({ habit_id: validUuid });
  });
});

describe("rowToHabit", () => {
  const dailyRow = {
    id: validUuid,
    name: "Leer",
    description: null,
    icon: null,
    color: "#5e6ad2",
    frequency_type: "daily" as const,
    target_per_period: 1,
    interval_days: null,
    days_of_week: null,
    sort_order: 0,
    created_at: validIso,
    updated_at: validIso,
    archived_at: null,
  };

  it("reconstruye una frecuencia daily desde la fila", () => {
    const habit = rowToHabit(dailyRow);
    expect(habit.frequency).toEqual({ type: "daily", target_per_period: 1 });
  });

  it("reconstruye una frecuencia interval con interval_days desde la fila", () => {
    const habit = rowToHabit({ ...dailyRow, frequency_type: "interval", interval_days: 5 });
    expect(habit.frequency).toEqual({
      type: "interval",
      target_per_period: 1,
      interval_days: 5,
    });
  });

  it("rechaza una fila que no cumple HabitRowSchema", () => {
    expect(() =>
      rowToHabit({ ...dailyRow, color: "no-es-hex" } as never),
    ).toThrow();
  });
});

describe("rowToHabitLog", () => {
  it("valida y devuelve un HabitLog desde HabitLogRow", () => {
    const row = {
      id: validUuid,
      habit_id: validUuid,
      log_date: validDate,
      completed_at: validIso,
      note: null,
      created_at: validIso,
    };
    expect(rowToHabitLog(row).log_date).toBe(validDate);
  });
});

describe("HabitRowSchema / HabitLogRowSchema", () => {
  it("HabitRowSchema acepta strings sin trim (es la forma raw de SQLite)", () => {
    const row = {
      id: validUuid,
      name: "  con espacios  ",
      description: null,
      icon: null,
      color: "#fff000",
      frequency_type: "daily",
      target_per_period: 1,
      interval_days: null,
      days_of_week: null,
      sort_order: 0,
      created_at: "algo",
      updated_at: "algo",
      archived_at: null,
    };
    expect(HabitRowSchema.parse(row).name).toBe("  con espacios  ");
  });

  it("HabitLogRowSchema es permisivo con timestamps (cualquier string)", () => {
    const row = {
      id: validUuid,
      habit_id: validUuid,
      log_date: "2026-06-27",
      completed_at: "cualquier cosa",
      note: null,
      created_at: "cualquier cosa",
    };
    expect(HabitLogRowSchema.parse(row).log_date).toBe("2026-06-27");
  });
});

describe("habitToRow", () => {
  it("aplana un hábito diario", () => {
    const row = habitToRow({
      name: "X",
      color: "#5e6ad2",
      frequency: { type: "daily", target_per_period: 1 },
    });
    expect(row).toMatchObject({
      frequency_type: "daily",
      target_per_period: 1,
      interval_days: null,
      days_of_week: null,
    });
  });

  it("aplana un hábito interval extrayendo interval_days", () => {
    const row = habitToRow({
      name: "X",
      color: "#5e6ad2",
      frequency: { type: "interval", target_per_period: 1, interval_days: 7 },
    });
    expect(row.frequency_type).toBe("interval");
    expect(row.interval_days).toBe(7);
  });
});
