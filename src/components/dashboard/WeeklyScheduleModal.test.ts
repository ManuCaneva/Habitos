import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeeklyScheduleModal from './WeeklyScheduleModal.vue'

const mockStore = {
  createBlock: vi.fn(),
  updateBlock: vi.fn(),
  deleteBlock: vi.fn(),
  addSlot: vi.fn(),
  updateSlot: vi.fn(),
  deleteSlot: vi.fn(),
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

describe('WeeklyScheduleModal', () => {
  let wrapper: VueWrapper<any>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    document.body.innerHTML = ''
  })

  const validBlockWithSlots = {
    id: '333e8400-e29b-41d4-a716-446655440000',
    title: 'Redes de datos',
    color: 'cyan' as const,
    sort_order: 0,
    created_at: '2026-07-12T19:00:00.000Z',
    updated_at: '2026-07-12T19:00:00.000Z',
    slots: [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        block_id: '333e8400-e29b-41d4-a716-446655440000',
        day_of_week: 1,
        start_minutes: 995,
        end_minutes: 1230,
        created_at: '2026-07-12T19:00:00.000Z',
        updated_at: '2026-07-12T19:00:00.000Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        block_id: '333e8400-e29b-41d4-a716-446655440000',
        day_of_week: 3,
        start_minutes: 1230,
        end_minutes: 1365,
        created_at: '2026-07-12T19:00:00.000Z',
        updated_at: '2026-07-12T19:00:00.000Z',
      },
    ],
  }

  it("renderiza el título 'Nuevo bloque' si block es null", () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: null,
      },
      attachTo: document.body,
    })

    const dialog = document.body.querySelector("[role='dialog']")
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain('Nuevo bloque')
  })

  it("renderiza el título 'Editar bloque' e inputs llenos si block es provisto", () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: validBlockWithSlots,
      },
      attachTo: document.body,
    })

    const dialog = document.body.querySelector("[role='dialog']")
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain('Editar bloque')
    const titleInput = document.body.querySelector(
      "input[placeholder='Ej. Gimnasio']"
    ) as HTMLInputElement
    expect(titleInput).not.toBeNull()
    expect(titleInput.value).toBe('Redes de datos')
  })

  it('muestra la lista de slots en modo edición', () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: validBlockWithSlots,
      },
      attachTo: document.body,
    })

    const dialog = document.body.querySelector("[role='dialog']")
    expect(dialog).not.toBeNull()
    expect(dialog!.textContent).toContain('Martes')
    expect(dialog!.textContent).toContain('Jueves')
    expect(dialog!.textContent).toContain('16:35')
    expect(dialog!.textContent).toContain('20:30')
    expect(dialog!.textContent).toContain('20:30')
    expect(dialog!.textContent).toContain('22:45')
  })

  it('emite close al hacer click en cancelar', async () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: null,
      },
      attachTo: document.body,
    })

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const cancelButton = buttons.find((b) => b.textContent?.includes('Cancelar'))
    expect(cancelButton).toBeDefined()
    await cancelButton!.click()
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('llama a deleteBlock y emite close al hacer click en eliminar', async () => {
    wrapper = mount(WeeklyScheduleModal, {
      props: {
        open: true,
        block: validBlockWithSlots,
      },
      attachTo: document.body,
    })

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const deleteButtons = buttons.filter((b) => b.textContent?.includes('Eliminar'))
    const blockDeleteButton = deleteButtons[deleteButtons.length - 1]
    expect(blockDeleteButton).toBeDefined()
    await blockDeleteButton.click()
    expect(mockStore.deleteBlock).toHaveBeenCalledWith(validBlockWithSlots.id)
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
