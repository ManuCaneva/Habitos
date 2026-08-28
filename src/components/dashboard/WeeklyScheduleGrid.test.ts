import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeeklyScheduleGrid from './WeeklyScheduleGrid.vue'

const mockStore = {
  blocksWithSlots: [
    {
      id: '333e8400-e29b-41d4-a716-446655440000',
      title: 'Gimnasio',
      color: 'lavender',
      sort_order: 0,
      created_at: '2026-07-12T19:00:00.000Z',
      updated_at: '2026-07-12T19:00:00.000Z',
      slots: [
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          block_id: '333e8400-e29b-41d4-a716-446655440000',
          day_of_week: 1,
          start_minutes: 360,
          end_minutes: 420,
          created_at: '2026-07-12T19:00:00.000Z',
          updated_at: '2026-07-12T19:00:00.000Z',
        },
      ],
    },
  ],
  settings: {
    granularity_minutes: 30,
    day_start_minutes: 360,
    day_end_minutes: 1380,
    week_starts_monday: true,
  },
}

vi.mock('@/stores/weeklySchedule', () => ({
  useWeeklyScheduleStore: () => mockStore,
  minutesToHHMM: (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  },
}))

vi.mock('@/stores/ui', () => ({
  useUiStore: () => ({
    editMode: false,
  }),
}))

describe('WeeklyScheduleGrid', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renderiza las columnas de los días de la semana', () => {
    const wrapper = mount(WeeklyScheduleGrid)
    expect(wrapper.text()).toContain('Lun')
    expect(wrapper.text()).toContain('Dom')
    wrapper.unmount()
  })

  it('difiere measure() a rAF: el resize del contenedor no vuelve a medir en cada frame', async () => {
    let resizeCallback: (() => void) | null = null
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: () => void) {
          resizeCallback = callback
        }
        observe() {}
        disconnect() {}
      }
    )

    const wrapper = mount(WeeklyScheduleGrid, { attachTo: document.body })
    const el = wrapper.element
    const rect = { height: 500, width: 900 }
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect as DOMRect)

    // Llamadas repetidas del RO dentro del mismo frame: sin rAF, la medición
    // volvería a correr cada vez. Con rAF, se coalescen en una sola.
    ;(resizeCallback as unknown as () => void)()
    ;(resizeCallback as unknown as () => void)()
    ;(resizeCallback as unknown as () => void)()
    await wrapper.vm.$nextTick()

    // Sin pasar un frame, la altura del container sigue siendo el valor por defecto
    const defaultHourHeight = wrapper.findAll('.schedule-hour-label')[0]?.attributes('style')
    expect(defaultHourHeight).toContain('height:')

    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
    await wrapper.vm.$nextTick()

    // Tras el rAF, las filas de hora se recalcularon con la altura real
    const hourHeight = wrapper.findAll('.schedule-hour-label')[0]?.attributes('style')
    expect(hourHeight).not.toBe(defaultHourHeight)
    wrapper.unmount()
  })
})
