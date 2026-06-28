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
