import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive } from 'vue'
import GcalVisibilityCard from './GcalVisibilityCard.vue'

type TestCalendar = {
  id: string
  summary: string
  primary?: boolean
  backgroundColor?: string
}

const mockStore = reactive({
  connected: true,
  calendars: [] as TestCalendar[],
  hiddenIds: new Set<string>(),
  fetchCalendars: vi.fn().mockResolvedValue(new Map<string, string>()),
  setCalendarHidden: vi.fn().mockResolvedValue(undefined),
  isCalendarHidden: (calendarId: string): boolean => mockStore.hiddenIds.has(calendarId),
})

vi.mock('@/stores/calendar', () => ({
  useCalendarStore: () => mockStore,
}))

const primaryCal: TestCalendar = {
  id: 'primary',
  summary: 'Personal',
  primary: true,
  backgroundColor: '#7986cb',
}
const workCal: TestCalendar = {
  id: 'work',
  summary: 'Trabajo',
  backgroundColor: '#33b679',
}
const utnCal: TestCalendar = {
  id: 'utn',
  summary: 'UTN Asignaturas',
  backgroundColor: '#e67c73',
}

describe('GcalVisibilityCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.connected = true
    mockStore.calendars = []
    mockStore.hiddenIds = new Set<string>()
  })

  it('lista todos los calendarios con color, nombre y checkbox según la preferencia', () => {
    mockStore.calendars = [primaryCal, workCal, utnCal]
    mockStore.hiddenIds = new Set(['utn'])

    const wrapper = mount(GcalVisibilityCard)

    const rows = wrapper.findAll("[data-testid='gcal-visibility-row']")
    expect(rows).toHaveLength(3)
    expect(wrapper.text()).toContain('Personal')
    expect(wrapper.text()).toContain('Trabajo')
    expect(wrapper.text()).toContain('UTN Asignaturas')

    const swatches = wrapper.findAll("[data-testid='gcal-visibility-swatch']")
    expect(swatches).toHaveLength(3)
    expect(swatches[0].attributes('style')).toContain('#7986cb')
    expect(swatches[1].attributes('style')).toContain('#33b679')
    expect(swatches[2].attributes('style')).toContain('#e67c73')

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes).toHaveLength(3)
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)
    expect((checkboxes[2].element as HTMLInputElement).checked).toBe(false)
  })

  it('un calendario sin color usa el token primary como swatch', () => {
    mockStore.calendars = [{ id: 'nocolor', summary: 'Sin color' }]

    const wrapper = mount(GcalVisibilityCard)

    const swatch = wrapper.find("[data-testid='gcal-visibility-swatch']")
    expect(swatch.attributes('style')).toContain('rgb(var(--color-primary))')
  })

  it('togglear un checkbox llama a setCalendarHidden con el valor invertido', async () => {
    mockStore.calendars = [primaryCal, utnCal]
    mockStore.hiddenIds = new Set(['utn'])

    const wrapper = mount(GcalVisibilityCard)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    // 'utn' está oculto (unchecked): tildar lo muestra
    await checkboxes[1].setValue(true)
    expect(mockStore.setCalendarHidden).toHaveBeenCalledWith('utn', false)

    // 'primary' está visible (checked): destildar lo oculta
    await checkboxes[0].setValue(false)
    expect(mockStore.setCalendarHidden).toHaveBeenCalledWith('primary', true)
  })

  it('toggle múltiple registra un llamado por calendario', async () => {
    mockStore.calendars = [primaryCal, workCal, utnCal]

    const wrapper = mount(GcalVisibilityCard)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')

    await checkboxes[1].setValue(false)
    await checkboxes[2].setValue(false)

    expect(mockStore.setCalendarHidden).toHaveBeenCalledTimes(2)
    expect(mockStore.setCalendarHidden).toHaveBeenCalledWith('work', true)
    expect(mockStore.setCalendarHidden).toHaveBeenCalledWith('utn', true)
  })

  it('el primario se puede ocultar como cualquier otro', async () => {
    mockStore.calendars = [primaryCal, workCal]
    mockStore.hiddenIds = new Set(['primary'])

    const wrapper = mount(GcalVisibilityCard)

    const primaryRow = wrapper.find(
      "[data-testid='gcal-visibility-row'][data-calendar-id='primary']"
    )
    expect(primaryRow.exists()).toBe(true)
    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false)

    await checkboxes[0].setValue(true)
    expect(mockStore.setCalendarHidden).toHaveBeenCalledWith('primary', false)
  })

  it('al montar hace fetch liviano una sola vez si hay conexión y la lista está vacía', () => {
    mockStore.connected = true
    mockStore.calendars = []

    mount(GcalVisibilityCard)

    expect(mockStore.fetchCalendars).toHaveBeenCalledTimes(1)
  })

  it('no fetchea al montar si ya hay lista', () => {
    mockStore.connected = true
    mockStore.calendars = [primaryCal]

    mount(GcalVisibilityCard)

    expect(mockStore.fetchCalendars).not.toHaveBeenCalled()
  })

  it('no fetchea al montar si no hay conexión', () => {
    mockStore.connected = false
    mockStore.calendars = []

    mount(GcalVisibilityCard)

    expect(mockStore.fetchCalendars).not.toHaveBeenCalled()
  })

  it('sin conexión muestra estado vacío claro sin filas', () => {
    mockStore.connected = false
    mockStore.calendars = []

    const wrapper = mount(GcalVisibilityCard)

    expect(wrapper.find("[data-testid='gcal-visibility-empty']").exists()).toBe(true)
    expect(wrapper.text()).toContain('Conectá Google Calendar')
    expect(wrapper.findAll("[data-testid='gcal-visibility-row']")).toHaveLength(0)
  })

  it('con conexión y lista vacía no muestra el estado vacío de sin-conexión', () => {
    mockStore.connected = true
    mockStore.calendars = []

    const wrapper = mount(GcalVisibilityCard)

    expect(wrapper.find("[data-testid='gcal-visibility-empty']").exists()).toBe(false)
    expect(wrapper.findAll("[data-testid='gcal-visibility-row']")).toHaveLength(0)
  })
})
