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
    week_starts_monday: true,
  },
  visibleWindow: { start_minutes: 360, end_minutes: 1380 },
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

  it('renderiza las filas a partir de la Ventana visible derivada (no de settings)', () => {
    mockStore.visibleWindow = { start_minutes: 900, end_minutes: 960 }
    mockStore.settings.granularity_minutes = 30
    const wrapper = mount(WeeklyScheduleGrid)
    const labels = wrapper.findAll('.schedule-hour-label').map((w) => w.text())
    expect(labels).toEqual(['15:00', '15:30'])
    wrapper.unmount()
    mockStore.visibleWindow = { start_minutes: 360, end_minutes: 1380 }
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

  it('muestra un solo bloque con dos slots (lunes 15:50 y jueves 18:10) como un único título', () => {
    mockStore.blocksWithSlots = [
      {
        id: '333e8400-e29b-41d4-a716-446655440000',
        title: 'AACSW',
        color: 'cyan',
        sort_order: 0,
        created_at: '2026-07-12T19:00:00.000Z',
        updated_at: '2026-07-12T19:00:00.000Z',
        slots: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            block_id: '333e8400-e29b-41d4-a716-446655440000',
            day_of_week: 0,
            start_minutes: 950, // 15:50
            end_minutes: 1085, // 18:05
            created_at: '2026-07-12T19:00:00.000Z',
            updated_at: '2026-07-12T19:00:00.000Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            block_id: '333e8400-e29b-41d4-a716-446655440000',
            day_of_week: 3,
            start_minutes: 1090, // 18:10
            end_minutes: 1225, // 20:25
            created_at: '2026-07-12T19:00:00.000Z',
            updated_at: '2026-07-12T19:00:00.000Z',
          },
        ],
      },
    ]
    mockStore.visibleWindow = { start_minutes: 900, end_minutes: 1260 } // 15:00-21:00
    const wrapper = mount(WeeklyScheduleGrid)

    const blocks = wrapper.findAll('.schedule-block')
    expect(blocks).toHaveLength(2)
    expect(blocks.map((b) => b.attributes('data-day'))).toEqual(['0', '3'])
    expect(blocks.map((b) => b.attributes('data-start'))).toEqual(['950', '1090'])
    expect(blocks.map((b) => b.attributes('data-end'))).toEqual(['1085', '1225'])
    // Ambos slots son de la misma instancia AACSW
    blocks.forEach((b) => expect(b.text()).toContain('AACSW'))
    wrapper.unmount()

    mockStore.blocksWithSlots = [
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
    ]
    mockStore.visibleWindow = { start_minutes: 360, end_minutes: 1380 }
  })
})
