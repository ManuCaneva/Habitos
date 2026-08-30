import type { HabitFrequency } from '@/schemas/habits'

export function frequencyLabel(f: HabitFrequency): string {
  switch (f.type) {
    case 'daily':
      return f.target_per_period > 1 ? `Diario · ${f.target_per_period}/día` : 'Diario'
    case 'weekly':
      return 'Semanal'
    case 'interval':
      return `Cada ${f.interval_days} días`
  }
}
