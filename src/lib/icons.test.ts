import { describe, it, expect } from "vitest";
import { HABIT_ICONS, DEFAULT_HABIT_ICON, iconFor } from "./icons";

describe("habit icons", () => {
  it("tiene al menos 24 iconos", () => {
    expect(HABIT_ICONS.length).toBeGreaterThanOrEqual(24);
  });
  it("valores únicos y etiquetas no vacías", () => {
    const values = HABIT_ICONS.map((i) => i.value);
    expect(new Set(values).size).toBe(values.length);
    for (const i of HABIT_ICONS) expect(i.name.length).toBeGreaterThan(0);
  });
  it("DEFAULT_HABIT_ICON es un valor válido", () => {
    expect(HABIT_ICONS.some((i) => i.value === DEFAULT_HABIT_ICON)).toBe(true);
  });
  it("iconFor devuelve el icono por valor", () => {
    const first = HABIT_ICONS[0];
    expect(iconFor(first.value)?.value).toBe(first.value);
  });
  it("iconFor cae en default para null/desconocido", () => {
    expect(iconFor(null)?.value).toBe(DEFAULT_HABIT_ICON);
    expect(iconFor("no-existe")?.value).toBe(DEFAULT_HABIT_ICON);
  });
});
