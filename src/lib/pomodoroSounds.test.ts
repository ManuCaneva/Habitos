import { afterEach, describe, expect, it, vi } from 'vitest'
import { defaultPomodoroSettings } from '@/schemas/pomodoro'
import { createPomodoroSoundPlayer } from './pomodoroSounds'

type MockAudioNode = {
  connect: ReturnType<typeof vi.fn>
  disconnect: ReturnType<typeof vi.fn>
}

function createAudioContextMock() {
  const gain = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
  }
  const oscillators: Array<
    MockAudioNode & {
      frequency: { setValueAtTime: ReturnType<typeof vi.fn> }
      start: ReturnType<typeof vi.fn>
      stop: ReturnType<typeof vi.fn>
      type: string
    }
  > = []
  const context = {
    currentTime: 10,
    destination: {},
    state: 'suspended' as AudioContextState,
    resume: vi.fn(async () => undefined),
    createGain: vi.fn(() => gain),
    createOscillator: vi.fn(() => {
      const oscillator = {
        connect: vi.fn(),
        disconnect: vi.fn(),
        frequency: { setValueAtTime: vi.fn() },
        start: vi.fn(),
        stop: vi.fn(),
        type: '',
      }
      oscillators.push(oscillator)
      return oscillator
    }),
  }

  return { context, gain, oscillators }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('pomodoro sound player', () => {
  it('prepares audio on a user gesture and plays a focus chime with configured volume', async () => {
    const audio = createAudioContextMock()
    const AudioContextMock = vi.fn(function () {
      return audio.context
    })
    vi.stubGlobal('AudioContext', AudioContextMock)
    const player = createPomodoroSoundPlayer()

    await player.prepareFromUserGesture()
    player.playFocusEndChime({ ...defaultPomodoroSettings, volume: 0.4 })

    expect(AudioContextMock).toHaveBeenCalledOnce()
    expect(audio.context.resume).toHaveBeenCalledOnce()
    expect(audio.gain.gain.setValueAtTime).toHaveBeenCalledWith(0.4, 10)
    expect(audio.oscillators).toHaveLength(2)
    expect(audio.oscillators[0].start).toHaveBeenCalledWith(10)
    expect(audio.oscillators[0].stop).toHaveBeenCalledWith(10.45)
    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(880, 10)
    expect(audio.oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(1174.66, 10.16)
  })

  it('uses a distinct break chime and does not play while muted', async () => {
    const audio = createAudioContextMock()
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function () {
        return audio.context
      })
    )
    const player = createPomodoroSoundPlayer()

    await player.prepareFromUserGesture()
    player.playBreakEndChime({ ...defaultPomodoroSettings, volume: 0.8 })
    player.playFocusEndChime({ ...defaultPomodoroSettings, muted: true })
    player.playBreakEndChime({ ...defaultPomodoroSettings, volume: 0 })

    expect(audio.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(523.25, 10)
    expect(audio.oscillators[1].frequency.setValueAtTime).toHaveBeenCalledWith(659.25, 10.16)
    expect(audio.oscillators).toHaveLength(2)
  })

  it('does not create or play audio before preparation', () => {
    const AudioContextMock = vi.fn()
    vi.stubGlobal('AudioContext', AudioContextMock)
    const player = createPomodoroSoundPlayer()

    player.playFocusEndChime(defaultPomodoroSettings)

    expect(AudioContextMock).not.toHaveBeenCalled()
  })

  it('resolves safely when AudioContext construction throws (WebKitGTK backend unavailable)', async () => {
    const AudioContextMock = vi.fn(() => {
      throw new Error('WebKitGTK audio unavailable')
    })
    vi.stubGlobal('AudioContext', AudioContextMock)
    const player = createPomodoroSoundPlayer()

    await expect(player.prepareFromUserGesture()).resolves.toBeUndefined()
    expect(AudioContextMock).toHaveBeenCalledOnce()

    // subsequent chime attempts degrade silently
    expect(() => player.playFocusEndChime(defaultPomodoroSettings)).not.toThrow()
    expect(() => player.playBreakEndChime(defaultPomodoroSettings)).not.toThrow()
  })

  it('resolves safely when AudioContext resume rejects', async () => {
    const audio = createAudioContextMock()
    audio.context.resume = vi.fn(async () => {
      throw new Error('resume failed')
    })
    vi.stubGlobal(
      'AudioContext',
      vi.fn(function () {
        return audio.context
      })
    )
    const player = createPomodoroSoundPlayer()

    await expect(player.prepareFromUserGesture()).resolves.toBeUndefined()
    expect(audio.context.resume).toHaveBeenCalledOnce()

    // preparation failure must not break subsequent preparation or playback
    await expect(player.prepareFromUserGesture()).resolves.toBeUndefined()
    expect(() => player.playFocusEndChime(defaultPomodoroSettings)).not.toThrow()
  })
})
