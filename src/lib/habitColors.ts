export interface HabitColor {
  value: string
  name: string
}

export const HABIT_COLORS: readonly HabitColor[] = [
  { value: '#6e56cf', name: 'Lavanda' },
  { value: '#52b87a', name: 'Verde' },
  { value: '#e9c45a', name: 'Amarillo' },
  { value: '#e55e54', name: 'Rojo' },
  { value: '#e682af', name: 'Rosa' },
  { value: '#5eaeb0', name: 'Cyan' },
  { value: '#ec964a', name: 'Naranja' },
  { value: '#d6d1c5', name: 'Hueso' },
] as const

export const DEFAULT_HABIT_COLOR = HABIT_COLORS[0].value

export const HEATMAP_BASE_INTENSITY = 0.15

export function intensityFor(count: number, target: number): number {
  if (count <= 0) return HEATMAP_BASE_INTENSITY
  const ratio = Math.min(1, count / Math.max(1, target))
  return HEATMAP_BASE_INTENSITY + (1 - HEATMAP_BASE_INTENSITY) * ratio
}

export function shadeFor(color: string, intensity: number): string {
  const hex = color.replace('#', '')
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return 'rgba(0, 0, 0, 0)'
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  const alpha = Math.max(0, Math.min(1, intensity))
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
