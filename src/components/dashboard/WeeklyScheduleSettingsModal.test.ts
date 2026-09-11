import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import WeeklyScheduleSettingsModal from './WeeklyScheduleSettingsModal.vue'

const mockStore = {
  settings: {
    granularity_minutes: 30,
    week_starts_monday: true,
    enabled_days: [0, 1, 2, 3, 4, 5, 6],
  },
  saveSettings: vi.fn(),
}

vi.mock('@/stores/weeklySchedule', () => ({
  useWeeklyScheduleStore: () => mockStore,
  minutesToHHMM: (min: number) => {
    const h = Math.floor(min / 60)
    const m = min % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  },
  hhmmToMinutes: (s: string) => {
    const [h, m] = s.split(':').map(Number)
    return h * 60 + m
  },
}))

describe('WeeklyScheduleSettingsModal', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockStore.settings.enabled_days = [0, 1, 2, 3, 4, 5, 6]
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    document.body.innerHTML = ''
  })

  it('renderiza el título de ajustes', () => {
    wrapper = mount(WeeklyScheduleSettingsModal, {
      props: { open: true },
      attachTo: document.body,
    })

    const dialog = document.body.querySelector("[role='dialog']")
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain('Ajustes del cronograma')
  })

  it('solo ofrece granularidad: no hay rastros de Desde/Hasta', () => {
    wrapper = mount(WeeklyScheduleSettingsModal, {
      props: { open: true },
      attachTo: document.body,
    })

    const dialog = document.body.querySelector("[role='dialog']")
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain('Granularidad')
    expect(dialog!.textContent).not.toContain('Desde')
    expect(dialog!.textContent).not.toContain('Hasta')
  })

  it('llama a saveSettings al guardar con los nuevos valores', async () => {
    wrapper = mount(WeeklyScheduleSettingsModal, {
      props: { open: true },
      attachTo: document.body,
    })

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const saveButton = buttons.find((b) => b.textContent?.includes('Guardar'))
    expect(saveButton).toBeDefined()
    await saveButton!.click()

    expect(mockStore.saveSettings).toHaveBeenCalledTimes(1)
    expect(mockStore.saveSettings).toHaveBeenCalledWith({
      granularity_minutes: 30,
      enabled_days: [0, 1, 2, 3, 4, 5, 6],
    })
  })

  it('guarda los días activos al desactivar uno', async () => {
    wrapper = mount(WeeklyScheduleSettingsModal, {
      props: { open: false },
      attachTo: document.body,
    })
    await wrapper.setProps({ open: true })

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const martes = buttons.find((b) => b.textContent?.trim() === 'Mar')
    expect(martes).toBeDefined()
    await martes!.click()

    const saveButton = buttons.find((b) => b.textContent?.includes('Guardar'))
    await saveButton!.click()

    expect(mockStore.saveSettings).toHaveBeenCalledWith({
      granularity_minutes: 30,
      enabled_days: [0, 2, 3, 4, 5, 6],
    })
  })

  it('no permite quedarse sin días activos', async () => {
    mockStore.settings.enabled_days = [0]
    wrapper = mount(WeeklyScheduleSettingsModal, {
      props: { open: false },
      attachTo: document.body,
    })
    await wrapper.setProps({ open: true })

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const lunes = buttons.find((b) => b.textContent?.trim() === 'Lun')
    expect(lunes).toBeDefined()
    await lunes!.click()
    await nextTick()

    expect(document.body.textContent).toContain('Seleccioná al menos un día')
    expect(lunes!.getAttribute('aria-pressed')).toBe('true')
  })
})
