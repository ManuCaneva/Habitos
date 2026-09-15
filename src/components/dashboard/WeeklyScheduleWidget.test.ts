import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeeklyScheduleWidget from './WeeklyScheduleWidget.vue'
import { hasRawPaletteColor } from '@/test/colorGuard'

let lastErrorValue: string | null = null

vi.mock('@/stores/weeklySchedule', () => ({
  useWeeklyScheduleStore: () => ({
    blocksWithSlots: [],
    settings: {
      granularity_minutes: 30,
      week_starts_monday: true,
      enabled_days: [0, 1, 2, 3, 4, 5, 6],
    },
    enabledDays: [0, 1, 2, 3, 4, 5, 6],
    loading: false,
    get lastError() {
      return lastErrorValue
    },
    blocksByDay: new Map(),
    visibleWindow: { start_minutes: 360, end_minutes: 1380 },
    loadAll: vi.fn(),
  }),
  minutesToHHMM: (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  },
  BLOCK_COLOR_TOKENS: ['lavender', 'green'] as const,
}))

vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({
    editMode: false,
  }),
}))

describe('WeeklyScheduleWidget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    lastErrorValue = null
  })

  it('renderiza el widget de cronograma semanal', () => {
    const wrapper = mount(WeeklyScheduleWidget)
    expect(wrapper.find("[data-testid='weekly-schedule-widget']").exists()).toBe(true)
    expect(wrapper.text()).toContain('Cronograma Semanal')
  })

  it('no usa colores de paleta cruda de Tailwind', () => {
    const wrapper = mount(WeeklyScheduleWidget)
    expect(hasRawPaletteColor(wrapper.html())).toBe(false)
  })

  it('el banner de error usa el acento rojo, no la paleta cruda', () => {
    lastErrorValue = 'boom'
    const wrapper = mount(WeeklyScheduleWidget)
    expect(wrapper.text()).toContain('boom')
    expect(hasRawPaletteColor(wrapper.html())).toBe(false)
  })
})
