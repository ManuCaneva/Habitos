import type { HabitFrequency } from "@/schemas/habits";

export function frequencyLabel(f: HabitFrequency): string {
  switch (f.type) {
    case "daily":
      return "Diario";
    case "weekly":
      return "Semanal";
    case "interval":
      return `Cada ${f.interval_days} días`;
  }
}
