import { describe, expect, it } from 'vitest'
import {
  formatRemainingTime,
  getPhaseDurationMs,
  getProgressFraction,
  getRemainingMs,
  nextPhase,
} from './pomodoro'
import { defaultPomodoroSettings } from '@/schemas/pomodoro'

describe('pomodoro helpers', () => {
  it('looks up the configured duration for every phase', () => {
    const settings = {
      ...defaultPomodoroSettings,
      focusMinutes: 30,
      shortBreakMinutes: 7,
      longBreakMinutes: 20,
    }

    expect(getPhaseDurationMs('idle', settings)).toBe(0)
    expect(getPhaseDurationMs('focus', settings)).toBe(30 * 60_000)
    expect(getPhaseDurationMs('shortBreak', settings)).toBe(7 * 60_000)
    expect(getPhaseDurationMs('longBreak', settings)).toBe(20 * 60_000)
  })

  it('calculates remaining time from an end instant without going negative', () => {
    const endsAt = '2026-09-01T12:01:30.000Z'

    expect(getRemainingMs(endsAt, '2026-09-01T12:00:00.000Z')).toBe(90_000)
    expect(getRemainingMs(endsAt, '2026-09-01T12:02:00.000Z')).toBe(0)
  })

  it('follows the phase sequence and inserts a long break at the interval', () => {
    expect(nextPhase('focus', 1, 4)).toBe('shortBreak')
    expect(nextPhase('focus', 4, 4)).toBe('longBreak')
    expect(nextPhase('focus', 1, 1)).toBe('longBreak')
    expect(nextPhase('shortBreak', 4, 4)).toBe('focus')
    expect(nextPhase('longBreak', 4, 4)).toBe('focus')
    expect(nextPhase('idle', 0, 4)).toBe('focus')
  })

  it('formats zero, normal values, and rounds a partial second up', () => {
    expect(formatRemainingTime(0)).toBe('00:00')
    expect(formatRemainingTime(65_000)).toBe('01:05')
    expect(formatRemainingTime(59_999)).toBe('01:00')
  })

  it('clamps progress at the phase boundaries', () => {
    expect(getProgressFraction(100, 100)).toBe(0)
    expect(getProgressFraction(0, 100)).toBe(1)
    expect(getProgressFraction(50, 100)).toBe(0.5)
    expect(getProgressFraction(200, 100)).toBe(0)
  })
})
