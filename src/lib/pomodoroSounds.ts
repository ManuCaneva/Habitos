import type { PomodoroSettings } from '@/schemas/pomodoro'

type ChimeNote = {
  frequency: number
  offsetSeconds: number
}
type Chime = readonly ChimeNote[]

const focusEndChime: Chime = [
  { frequency: 880, offsetSeconds: 0 },
  { frequency: 1174.66, offsetSeconds: 0.16 },
]

const breakEndChime: Chime = [
  { frequency: 523.25, offsetSeconds: 0 },
  { frequency: 659.25, offsetSeconds: 0.16 },
]

export interface PomodoroSoundPlayer {
  prepareFromUserGesture(): Promise<void>
  playFocusEndChime(settings: PomodoroSettings): void
  playBreakEndChime(settings: PomodoroSettings): void
}

export function createPomodoroSoundPlayer(): PomodoroSoundPlayer {
  let context: AudioContext | null = null

  async function prepareFromUserGesture(): Promise<void> {
    if (context === null) {
      try {
        context = new AudioContext()
      } catch {
        context = null
        return
      }
    }
    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch {
        // best-effort: WebKitGTK/pa backend may reject
      }
    }
  }

  function play(chime: Chime, settings: PomodoroSettings): void {
    if (settings.muted || settings.volume <= 0 || context === null) return

    const now = context.currentTime
    const gain = context.createGain()
    gain.gain.setValueAtTime(settings.volume, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5)
    gain.connect(context.destination)

    for (const { frequency, offsetSeconds } of chime) {
      const oscillator = context.createOscillator()
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(frequency, now + offsetSeconds)
      oscillator.connect(gain)
      oscillator.start(now + offsetSeconds)
      oscillator.stop(now + offsetSeconds + 0.45)
    }
  }

  return {
    prepareFromUserGesture,
    playFocusEndChime: (settings) => play(focusEndChime, settings),
    playBreakEndChime: (settings) => play(breakEndChime, settings),
  }
}
