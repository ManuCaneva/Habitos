import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeeklyScheduleGrid from './WeeklyScheduleGrid.vue'
import { hasRawPaletteColor } from '@/test/colorGuard'

function defaultBlocksWithSlots() {
  return [
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
}

const defaultSettings = () => ({
  granularity_minutes: 30,
  week_starts_monday: true,
  enabled_days: [0, 1, 2, 3, 4, 5, 6],
})

const mockStore = {
  blocksWithSlots: defaultBlocksWithSlots(),
  settings: defaultSettings(),
  enabledDays: [0, 1, 2, 3, 4, 5, 6],
  visibleWindow: { start_minutes: 360, end_minutes: 1380 },
}

function stylePx(el: { attributes: (n: string) => string | undefined }, prop: string): number {
  const style = el.attributes('style') ?? ''
  const entry = style
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(prop + ':'))
  return Number.parseFloat(entry?.split(':')[1]?.trim() ?? '')
}

function nextFrame(): Promise<unknown> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
}

function stubResizeObserver() {
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
  return () => resizeCallback?.()
}

async function mountMeasured(containerHeight: number, headerHeight = 0) {
  const triggerResize = stubResizeObserver()
  const wrapper = mount(WeeklyScheduleGrid, { attachTo: document.body })
  const container = wrapper.element as HTMLElement
  vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
    height: containerHeight,
    width: 900,
  } as DOMRect)
  const header = wrapper.find('.schedule-header').element as HTMLElement
  vi.spyOn(header, 'getBoundingClientRect').mockReturnValue({
    height: headerHeight,
    width: 900,
  } as DOMRect)
  triggerResize()
  await nextFrame()
  await wrapper.vm.$nextTick()
  return wrapper
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
    mockStore.blocksWithSlots = defaultBlocksWithSlots()
    mockStore.settings = defaultSettings()
    mockStore.visibleWindow = { start_minutes: 360, end_minutes: 1380 }
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('no usa colores de paleta cruda de Tailwind', () => {
    const wrapper = mount(WeeklyScheduleGrid)
    expect(hasRawPaletteColor(wrapper.html())).toBe(false)
    wrapper.unmount()
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
    const triggerResize = stubResizeObserver()

    const wrapper = mount(WeeklyScheduleGrid, { attachTo: document.body })
    const el = wrapper.element
    const rect = { height: 500, width: 900 }
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect as DOMRect)

    // Llamadas repetidas del RO dentro del mismo frame: sin rAF, la medición
    // volvería a correr cada vez. Con rAF, se coalescen en una sola.
    triggerResize()
    triggerResize()
    triggerResize()
    await wrapper.vm.$nextTick()

    // Sin pasar un frame, la altura del container sigue siendo el valor por defecto
    const defaultHourHeight = wrapper.findAll('.schedule-hour-label')[0]?.attributes('style')
    expect(defaultHourHeight).toContain('height:')

    await nextFrame()
    await wrapper.vm.$nextTick()

    // Tras el rAF, las filas de hora se recalcularon con la altura real
    const hourHeight = wrapper.findAll('.schedule-hour-label')[0]?.attributes('style')
    expect(hourHeight).not.toBe(defaultHourHeight)
    wrapper.unmount()
  })

  it('comprime la grilla a lo disponible sin piso mínimo: no scrollea con contenedor bajo', async () => {
    const rows = Math.floor(
      (mockStore.visibleWindow.end_minutes - mockStore.visibleWindow.start_minutes) /
        mockStore.settings.granularity_minutes
    )
    const containerHeight = 240
    const headerHeight = 32
    const wrapper = await mountMeasured(containerHeight, headerHeight)

    // La ventana visible no se recalcula al comprimir: siguen estando todas las filas
    expect(wrapper.findAll('.schedule-hour-label')).toHaveLength(rows)

    const first = wrapper.findAll('.schedule-hour-label')[0]!
    const rowHeight = stylePx(first, 'height')
    // Sin piso mínimo, cada fila mide exactamente (contenedor - header) / filas
    expect(rowHeight).toBeCloseTo((containerHeight - headerHeight) / rows, 5)
    // Header + grilla caben dentro del contenedor: no hay scroll posible
    expect(headerHeight + rowHeight * rows).toBeLessThanOrEqual(containerHeight + 0.01)
    expect(wrapper.find('.overflow-y-auto').exists()).toBe(false)

    wrapper.unmount()
  })

  it('centra el número de hora sobre su línea (mitad por encima del borde superior)', () => {
    mockStore.visibleWindow = { start_minutes: 900, end_minutes: 1200 }
    const wrapper = mount(WeeklyScheduleGrid)

    const labels = wrapper.findAll('.schedule-hour-label')
    expect(labels.length).toBeGreaterThan(0)
    for (const label of labels) {
      // La celda arranca en la línea (border-b) y el texto se corre media línea arriba
      expect(label.classes()).toContain('items-start')
      const text = label.find('span')
      expect(text.exists()).toBe(true)
      expect(text.classes()).toContain('-translate-y-1/2')
    }

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
    // Ambos slots son de la misma instancia AACSW
    blocks.forEach((b) => expect(b.text()).toContain('AACSW'))

    // Posicionamiento vertical por minutos: el slot de Lunes (15:50) empieza
    // antes que el de Jueves (18:10), por lo que su `top` es menor.
    const monday = blocks[0]
    const thursday = blocks[1]
    expect(stylePx(thursday, 'top')).toBeGreaterThan(stylePx(monday, 'top'))
    // Ambos duran 135' (15:50-18:05 y 18:10-20:25) → misma altura
    expect(stylePx(monday, 'height')).toBeGreaterThan(0)
    expect(stylePx(monday, 'height')).toBe(stylePx(thursday, 'height'))
    wrapper.unmount()
  })

  it('recorta en el borde un slot que cruza la Ventana visible en vez de ocultarlo', () => {
    mockStore.settings.granularity_minutes = 30
    mockStore.visibleWindow = { start_minutes: 900, end_minutes: 1200 } // 15:00-20:00
    mockStore.blocksWithSlots = [
      {
        id: '333e8400-e29b-41d4-a716-446655440000',
        title: 'Adentro',
        color: 'lavender',
        sort_order: 0,
        created_at: '2026-07-12T19:00:00.000Z',
        updated_at: '2026-07-12T19:00:00.000Z',
        slots: [
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            block_id: '333e8400-e29b-41d4-a716-446655440000',
            day_of_week: 0,
            start_minutes: 960, // 16:00
            end_minutes: 1020, // 17:00 (60' visibles, íntegro)
            created_at: '2026-07-12T19:00:00.000Z',
            updated_at: '2026-07-12T19:00:00.000Z',
          },
        ],
      },
      {
        id: '333e8400-e29b-41d4-a716-446655440001',
        title: 'Cruza abajo',
        color: 'green',
        sort_order: 0,
        created_at: '2026-07-12T19:00:00.000Z',
        updated_at: '2026-07-12T19:00:00.000Z',
        slots: [
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            block_id: '333e8400-e29b-41d4-a716-446655440001',
            day_of_week: 1,
            start_minutes: 1140, // 19:00
            end_minutes: 1260, // 21:00 (recortado a 20:00)
            created_at: '2026-07-12T19:00:00.000Z',
            updated_at: '2026-07-12T19:00:00.000Z',
          },
        ],
      },
      {
        id: '333e8400-e29b-41d4-a716-446655440002',
        title: 'Cruza arriba',
        color: 'red',
        sort_order: 0,
        created_at: '2026-07-12T19:00:00.000Z',
        updated_at: '2026-07-12T19:00:00.000Z',
        slots: [
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            block_id: '333e8400-e29b-41d4-a716-446655440002',
            day_of_week: 2,
            start_minutes: 840, // 14:00
            end_minutes: 960, // 16:00 (recortado a 15:00)
            created_at: '2026-07-12T19:00:00.000Z',
            updated_at: '2026-07-12T19:00:00.000Z',
          },
        ],
      },
    ]

    const wrapper = mount(WeeklyScheduleGrid)
    const blocks = wrapper.findAll('.schedule-block')
    expect(blocks).toHaveLength(3)

    const byTitle = new Map(
      blocks.map((b) => [b.text().trim(), b] as [string, (typeof blocks)[number]])
    )
    const inside = byTitle.get('Adentro')!
    const crossesBottom = byTitle.get('Cruza abajo')!
    const crossesTop = byTitle.get('Cruza arriba')!
    const insideHeight = stylePx(inside, 'height')
    expect(insideHeight).toBeGreaterThan(0)

    // El que cruza el borde inferior se dibuja recortado: misma altura que un
    // slot íntegro de 60' (visible 19:00-20:00 pese a durar hasta las 21:00).
    expect(stylePx(crossesBottom, 'height')).toBe(insideHeight)

    // El que cruza el borde superior se dibuja desde el borde (top 0) recortado
    expect(stylePx(crossesTop, 'top')).toBe(0)
    expect(stylePx(crossesTop, 'height')).toBe(insideHeight)
    wrapper.unmount()
  })
})
