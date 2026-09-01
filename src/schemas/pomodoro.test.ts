import { describe, expect, it } from 'vitest'
import {
  ActivePomodoroSessionSchema,
  PomodoroSettingsSchema,
  defaultPomodoroSettings,
} from './pomodoro'

describe('pomodoro schemas', () => {
  it('provides the classic defaults', () => {
    expect(PomodoroSettingsSchema.parse({})).toEqual({
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakInterval: 4,
      autoStartBreak: true,
      autoStartFocus: false,
      volume: 1,
      muted: false,
    })
    expect(defaultPomodoroSettings).toEqual(PomodoroSettingsSchema.parse({}))
  })

  it('validates settings ranges and active sessions', () => {
    expect(() => PomodoroSettingsSchema.parse({ focusMinutes: 0 })).toThrow()
    expect(() => PomodoroSettingsSchema.parse({ volume: 1.1 })).toThrow()
    expect(() => ActivePomodoroSessionSchema.parse({ phase: 'invalid' })).toThrow()
    expect(() =>
      ActivePomodoroSessionSchema.parse({
        phase: 'focus',
        isRunning: true,
        endsAt: null,
        remainingMs: 1000,
        completedFocusSessions: 0,
      })
    ).toThrow()

    expect(
      ActivePomodoroSessionSchema.parse({
        phase: 'focus',
        isRunning: true,
        endsAt: '2026-09-01T12:25:00.000Z',
        remainingMs: null,
        completedFocusSessions: 0,
      })
    ).toEqual({
      phase: 'focus',
      isRunning: true,
      endsAt: '2026-09-01T12:25:00.000Z',
      remainingMs: null,
      completedFocusSessions: 0,
    })

    expect(
      ActivePomodoroSessionSchema.parse({
        phase: 'shortBreak',
        isRunning: false,
        endsAt: null,
        remainingMs: 120_000,
        completedFocusSessions: 1,
      })
    ).toMatchObject({ isRunning: false, remainingMs: 120_000 })
  })
})
