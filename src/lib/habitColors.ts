export interface HabitColor {
  value: string;
  name: string;
}

export const HABIT_COLORS: readonly HabitColor[] = [
  { value: "#5e6ad2", name: "Lavanda" },
  { value: "#4cb782", name: "Verde" },
  { value: "#f2c94c", name: "Amarillo" },
  { value: "#eb5757", name: "Rojo" },
  { value: "#f178b6", name: "Rosa" },
  { value: "#56b6c2", name: "Cyan" },
  { value: "#f2994a", name: "Naranja" },
  { value: "#d4d4d4", name: "Hueso" },
] as const;

export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0].value;

export function shadeFor(color: string, intensity: 0 | 1): string {
  const hex = color.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return "rgba(0, 0, 0, 0)";
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const alpha = intensity === 1 ? 1 : 0.15;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
