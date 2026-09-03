import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper, DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeeklyScheduleModal from './WeeklyScheduleModal.vue'
import TimePicker from '@/components/ui/TimePicker.vue'

const mockStore = {
  saveBlock: vi.fn().mockResolvedValue(undefined),
  deleteBlock: vi.fn().mockResolvedValue(undefined),
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

async function clickButton(wrapper: VueWrapper<any>, label: string) {
  const buttons = Array.from(document.body.querySelectorAll('button'))
  const btn = buttons.find((b) => b.textContent?.trim() === label)
  if (!btn) throw new Error(`Botón "${label}" no encontrado`)
  await new DOMWrapper(btn).trigger('click')
  await wrapper.vm.$nextTick()
}

async function setTitle(value: string) {
  const titleInput = document.body.querySelector(
    "input[placeholder='Ej. Gimnasio']"
  ) as HTMLInputElement
  expect(titleInput).not.toBeNull()
  await new DOMWrapper(titleInput).setValue(value)
}

async function pickTimes(wrapper: VueWrapper<any>, start: string, end: string) {
  const pickers = wrapper.findAllComponents(TimePicker)
  pickers[0].vm.$emit('update:modelValue', start)
  pickers[1].vm.$emit('update:modelValue', end)
  await wrapper.vm.$nextTick()
}

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

  function mountModal(block: typeof validBlockWithSlots | null = null) {
    wrapper = mount(WeeklyScheduleModal, {
      props: { open: true, block },
      attachTo: document.body,
    })
    return wrapper
  }

  const dialogText = () =>
    (document.body.querySelector('[role="dialog"]') as HTMLElement)?.textContent ?? ''

  it("renderiza el título 'Nuevo bloque' si block es null", () => {
    mountModal(null)
    expect(dialogText()).toContain('Nuevo bloque')
    expect(dialogText()).toContain('Sin horarios asignados')
  })

  it("renderiza el título 'Editar bloque' con la lista de horarios del bloque", () => {
    mountModal(validBlockWithSlots)
    expect(dialogText()).toContain('Editar bloque')
    expect(dialogText()).toContain('Martes')
    expect(dialogText()).toContain('Jueves')
    expect(dialogText()).toContain('16:35 - 20:30')
    expect(dialogText()).toContain('20:30 - 22:45')
  })

  it('emite close al hacer click en cancelar', async () => {
    mountModal()
    await clickButton(wrapper, 'Cancelar')
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('en modo crear, Agregar solo suma a la lista local y no persiste nada', async () => {
    mountModal(null)
    await setTitle('AACSW')
    await clickButton(wrapper, 'Agregar') // defaults Lunes 06:00-07:00
    expect(dialogText()).toContain('Lunes')
    expect(dialogText()).toContain('06:00 - 07:00')
    expect(mockStore.saveBlock).not.toHaveBeenCalled()
  })

  it('en modo crear, Guardar persiste el bloque con todos sus horarios exactamente una vez', async () => {
    mountModal(null)
    await setTitle('AACSW')

    // Primer horario: Lunes 15:50-18:05
    await pickTimes(wrapper, '15:50', '18:05')
    const select = document.body.querySelector('select') as HTMLSelectElement
    await new DOMWrapper(select).setValue('0') // Lunes
    await clickButton(wrapper, 'Agregar')

    // Segundo horario: Jueves 18:10-20:25
    await pickTimes(wrapper, '18:10', '20:25')
    await new DOMWrapper(select).setValue('3') // Jueves
    await clickButton(wrapper, 'Agregar')

    expect(dialogText()).toContain('15:50 - 18:05')
    expect(dialogText()).toContain('18:10 - 20:25')
    expect(mockStore.saveBlock).not.toHaveBeenCalled()

    await clickButton(wrapper, 'Guardar')

    expect(mockStore.saveBlock).toHaveBeenCalledTimes(1)
    expect(mockStore.saveBlock).toHaveBeenCalledWith({
      title: 'AACSW',
      color: 'lavender',
      slots: [
        { day_of_week: 0, start_minutes: 950, end_minutes: 1085 },
        { day_of_week: 3, start_minutes: 1090, end_minutes: 1225 },
      ],
    })
    expect(wrapper.emitted('close')).toBeTruthy()
  })

  it('en modo crear, Guardar sin horarios muestra el aviso y no persiste', async () => {
    mountModal(null)
    mockStore.saveBlock.mockRejectedValueOnce(new Error('Agregá al menos un horario'))
    await clickButton(wrapper, 'Guardar')
    expect(dialogText()).toContain('Agregá al menos un horario')
    expect(mockStore.saveBlock).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('en modo crear, Guardar con título vacío muestra el error humano', async () => {
    mountModal(null)
    mockStore.saveBlock.mockRejectedValueOnce(new Error('El título es obligatorio'))
    await clickButton(wrapper, 'Guardar')
    expect(dialogText()).toContain('El título es obligatorio')
    expect(wrapper.emitted('close')).toBeFalsy()
  })

  it('muestra el error de solapamiento que lanza el store al Guardar', async () => {
    mountModal(null)
    mockStore.saveBlock.mockRejectedValueOnce(
      new Error('Los horarios se superponen con «Gimnasio»')
    )
    await setTitle('Estudio')
    await clickButton(wrapper, 'Guardar')
    expect(dialogText()).toContain('Los horarios se superponen con «Gimnasio»')
  })

  it('en modo edición, editar un horario in situ actualiza el draft y Guardar lo persiste con su id', async () => {
    mountModal(validBlockWithSlots)

    // Editar el primer horario (Martes 16:35-20:30) -> cambiar horas a 15:00-16:00, mismo día
    const editButtons = Array.from(document.body.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('Editar')
    )
    expect(editButtons).toHaveLength(2)
    await new DOMWrapper(editButtons[0]).trigger('click')
    await wrapper.vm.$nextTick()

    await pickTimes(wrapper, '15:00', '16:00')
    const select = document.body.querySelector('select') as HTMLSelectElement
    await new DOMWrapper(select).setValue('1')
    await clickButton(wrapper, 'Actualizar')

    expect(dialogText()).toContain('15:00 - 16:00')
    expect(dialogText()).not.toContain('16:35 - 20:30')

    await clickButton(wrapper, 'Guardar')
    expect(mockStore.saveBlock).toHaveBeenCalledTimes(1)
    expect(mockStore.saveBlock).toHaveBeenCalledWith({
      blockId: validBlockWithSlots.id,
      title: 'Redes de datos',
      color: 'cyan',
      slots: expect.arrayContaining([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          day_of_week: 1,
          start_minutes: 900,
          end_minutes: 960,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          day_of_week: 3,
          start_minutes: 1230,
          end_minutes: 1365,
        },
      ]),
    })
  })

  it('en modo edición, agregar un horario a la lista local no persiste hasta Guardar', async () => {
    mountModal(validBlockWithSlots)
    expect(dialogText()).toContain('16:35 - 20:30')

    await pickTimes(wrapper, '18:10', '20:25')
    const select = document.body.querySelector('select') as HTMLSelectElement
    await new DOMWrapper(select).setValue('4')
    await clickButton(wrapper, 'Agregar')

    expect(dialogText()).toContain('18:10 - 20:25')
    expect(mockStore.saveBlock).not.toHaveBeenCalled()

    await clickButton(wrapper, 'Guardar')
    expect(mockStore.saveBlock).toHaveBeenCalledTimes(1)
    const call = mockStore.saveBlock.mock.calls[0][0]
    expect(call.blockId).toBe(validBlockWithSlots.id)
    // El slot nuevo va sin id; los existentes conservan el suyo.
    expect(call.slots).toHaveLength(3)
    expect(call.slots.filter((s: any) => s.id === undefined)).toHaveLength(1)
    expect(call.slots.filter((s: any) => s.id !== undefined)).toHaveLength(2)
  })

  it('en modo edición, eliminar un horario de la lista lo quita del Guardar', async () => {
    mountModal(validBlockWithSlots)

    const deleteButtons = Array.from(document.body.querySelectorAll('button')).filter((b) =>
      b.textContent?.includes('Eliminar')
    )
    // Elimina el primer slot de la lista (Martes)
    await new DOMWrapper(deleteButtons[0]).trigger('click')
    await wrapper.vm.$nextTick()
    expect(dialogText()).not.toContain('16:35 - 20:30')
    expect(dialogText()).toContain('20:30 - 22:45')

    await clickButton(wrapper, 'Guardar')
    const call = mockStore.saveBlock.mock.calls[0][0]
    expect(call.slots).toHaveLength(1)
    expect(call.slots[0].id).toBe('550e8400-e29b-41d4-a716-446655440002')
  })

  it('llama a deleteBlock y emite close al eliminar el bloque completo', async () => {
    mountModal(validBlockWithSlots)

    const buttons = Array.from(document.body.querySelectorAll('button'))
    const deleteButtons = buttons.filter((b) => b.textContent?.includes('Eliminar'))
    const blockDeleteButton = deleteButtons[deleteButtons.length - 1]
    expect(blockDeleteButton).toBeDefined()
    await new DOMWrapper(blockDeleteButton).trigger('click')
    await wrapper.vm.$nextTick()
    expect(mockStore.deleteBlock).toHaveBeenCalledWith(validBlockWithSlots.id)
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
