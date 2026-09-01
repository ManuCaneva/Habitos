import type { PomodoroPhase, PomodoroSettings } from '@/schemas/pomodoro'

export function getPhaseDurationMs(phase: PomodoroPhase, settings: PomodoroSettings): number {
  if (phase === 'focus') return settings.focusMinutes * 60_000
  if (phase === 'shortBreak') return settings.shortBreakMinutes * 60_000
  if (phase === 'longBreak') return settings.longBreakMinutes * 60_000
  return 0
}

export function getRemainingMs(endsAt: string, now: string | Date = new Date()): number {
  return Math.max(0, new Date(endsAt).getTime() - new Date(now).getTime())
}

export function nextPhase(
  phase: PomodoroPhase,
  completedFocusSessions: number,
  longBreakInterval: number
): Exclude<PomodoroPhase, 'idle'> {
  if (phase === 'idle') return 'focus'
  if (phase === 'focus') {
    return completedFocusSessions > 0 && completedFocusSessions % longBreakInterval === 0
      ? 'longBreak'
      : 'shortBreak'
  }
  return 'focus'
}

export function formatRemainingTime(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function getProgressFraction(remainingMs: number, durationMs: number): number {
  if (durationMs <= 0) return 0
  return Math.min(1, Math.max(0, (durationMs - Math.max(0, remainingMs)) / durationMs))
}
