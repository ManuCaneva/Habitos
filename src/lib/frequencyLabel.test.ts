import { describe, it, expect } from 'vitest'
import { frequencyLabel } from './frequencyLabel'
import type { HabitFrequency } from '@/schemas/habits'

describe('frequencyLabel', () => {
  it('daily → Diario', () => {
    const f: HabitFrequency = { type: 'daily', target_per_period: 1 }
    expect(frequencyLabel(f)).toBe('Diario')
  })
  it('daily con target > 1 → "Diario · N/día"', () => {
    const f: HabitFrequency = { type: 'daily', target_per_period: 8 }
    expect(frequencyLabel(f)).toBe('Diario · 8/día')
  })
  it('weekly → Semanal', () => {
    const f: HabitFrequency = { type: 'weekly', target_per_period: 3 }
    expect(frequencyLabel(f)).toBe('Semanal')
  })
  it('interval → Cada N días', () => {
    const f: HabitFrequency = { type: 'interval', target_per_period: 1, interval_days: 2 }
    expect(frequencyLabel(f)).toBe('Cada 2 días')
  })
  it('interval respeta interval_days variable', () => {
    const f: HabitFrequency = { type: 'interval', target_per_period: 1, interval_days: 5 }
    expect(frequencyLabel(f)).toBe('Cada 5 días')
  })
})
