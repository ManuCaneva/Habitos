import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { reactive } from 'vue'
import PomodoroWidget from './PomodoroWidget.vue'

const mockPrepareAudio = vi.fn().mockResolvedValue(undefined)
const mockStart = vi.fn().mockResolvedValue(undefined)
const mockPause = vi.fn().mockResolvedValue(undefined)
const mockSetViewMode = vi.fn()
function createPomodoroState() {
  return reactive({
    settings: {
      focusMinutes: 25,
      shortBreakMinutes: 5,
      longBreakMinutes: 15,
      longBreakInterval: 4,
      autoStartBreak: true,
      autoStartFocus: false,
      volume: 0.7,
      mute: false,
    },
    session: {
      phase: 'focus' as const,
      isRunning: false,
      endsAt: null,
      remainingMs: 25 * 60 * 1000,
      completedFocusSessions: 0,
    },
    remainingMs: 25 * 60 * 1000,
  })
}

let pomodoroState = createPomodoroState()

vi.mock('@/stores/pomodoro', () => ({
  usePomodoroStore: () => ({
    ...pomodoroState,
    prepareAudio: mockPrepareAudio,
    start: mockStart,
    pause: mockPause,
  }),
}))

vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({ setViewMode: mockSetViewMode }),
}))

describe('PomodoroWidget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    mockPrepareAudio.mockClear()
    mockStart.mockClear()
    mockPause.mockClear()
    mockSetViewMode.mockClear()
    pomodoroState = createPomodoroState()
  })

  it('muestra la fase, countdown compacto y anillo de progreso', () => {
    const wrapper = mount(PomodoroWidget)

    expect(wrapper.get('[data-testid="pomodoro-widget-phase"]').text()).toBe('Enfoque')
    expect(wrapper.get('[data-testid="pomodoro-widget-countdown"]').text()).toBe('25:00')
    expect(wrapper.get('[data-testid="pomodoro-widget-progress"]').attributes('role')).toBe(
      'progressbar'
    )
  })

  it('inicia el timer desde el control del widget', async () => {
    const wrapper = mount(PomodoroWidget)

    await wrapper.get('[data-testid="pomodoro-widget-start"]').trigger('click')

    expect(mockPrepareAudio).toHaveBeenCalledOnce()
    expect(mockStart).toHaveBeenCalledOnce()
  })

  it('pausa el timer cuando está corriendo', async () => {
    pomodoroState.session.isRunning = true
    const wrapper = mount(PomodoroWidget)

    await wrapper.get('[data-testid="pomodoro-widget-pause"]').trigger('click')

    expect(mockPause).toHaveBeenCalledOnce()
  })

  it('navega a Pomodoro al hacer click en el cuerpo', async () => {
    const wrapper = mount(PomodoroWidget)

    await wrapper.get('[data-testid="pomodoro-widget"]').trigger('click')

    expect(mockSetViewMode).toHaveBeenCalledWith('pomodoro')
  })
})
