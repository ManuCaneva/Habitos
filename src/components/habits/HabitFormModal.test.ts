import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ref } from 'vue'
import type { HabitFrequency } from '@/schemas/habits'
import HabitFormModal from './HabitFormModal.vue'

const habitsState = ref<
  {
    id: string
    name: string
    description?: string | null
    color: string
    icon: string | null
    frequency?: HabitFrequency
  }[]
>([])
const habitsMock = {
  get habits() {
    return habitsState.value
  },
  createHabit: vi.fn().mockResolvedValue({}),
  updateHabit: vi.fn().mockResolvedValue({}),
}
const uiState = {
  createHabitOpen: ref(true),
  editingHabitId: ref<string | null>(null),
  closeModal: vi.fn(),
}
const uiMock = {
  get createHabitOpen() {
    return uiState.createHabitOpen.value
  },
  set createHabitOpen(v: boolean) {
    uiState.createHabitOpen.value = v
  },
  get editingHabitId() {
    return uiState.editingHabitId.value
  },
  set editingHabitId(v: string | null) {
    uiState.editingHabitId.value = v
  },
  closeModal: () => {
    uiState.closeModal()
    uiState.createHabitOpen.value = false
    uiState.editingHabitId.value = null
  },
}
vi.mock('@/stores/habits', () => ({
  useHabitsStore: () => habitsMock,
}))
vi.mock('@/stores/ui', () => ({
  useUiStore: () => uiMock,
}))

const wrappers: VueWrapper[] = []
function mountModal(): VueWrapper {
  const w = mount(HabitFormModal, { attachTo: document.body })
  wrappers.push(w)
  return w
}

function iconOptions() {
  return document.body.querySelectorAll<HTMLElement>("[data-testid='icon-option']")
}

function getForm() {
  return document.body.querySelector<HTMLFormElement>('form')!
}

function setInputValue(form: HTMLFormElement, value: string) {
  setFieldValue(form, 'input', value)
}

function setTextareaValue(form: HTMLFormElement, value: string) {
  setFieldValue(form, 'textarea', value)
}

function setNumberValue(form: HTMLFormElement, value: string) {
  setFieldValue(form, "input[type='number']", value)
}

function setFieldValue(
  form: HTMLFormElement,
  selector: 'input' | 'textarea' | "input[type='number']",
  value: string
) {
  const el = form.querySelector(selector)!
  const nativeSetter =
    selector === 'textarea'
      ? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')!.set!
      : Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!
  nativeSetter.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

describe('HabitFormModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    uiState.createHabitOpen.value = true
    uiState.editingHabitId.value = null
    uiState.closeModal.mockClear()
    habitsMock.createHabit.mockClear()
    habitsMock.updateHabit.mockClear()
    habitsState.value = []
  })

  afterEach(async () => {
    for (const w of wrappers.splice(0)) {
      w.unmount()
    }
    document.body.innerHTML = ''
    await flushPromises()
  })

  it('rendera grilla de iconos seleccionable', () => {
    mountModal()
    expect(iconOptions().length).toBeGreaterThan(0)
  })

  it('selecciona un icono al hacer click', async () => {
    const w = mountModal()
    const icons = iconOptions()
    icons[0].click()
    await w.vm.$nextTick()
    expect(icons[0].classList.contains('selected')).toBe(true)
  })

  it('incluye icon en el draft de creación', async () => {
    const w = mountModal()
    const form = getForm()
    setInputValue(form, 'Test habit')
    await w.vm.$nextTick()
    iconOptions()[2].click()
    await w.vm.$nextTick()
    form.requestSubmit()
    await flushPromises()
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({ icon: expect.any(String) })
    )
  })

  it('incluye description en el draft de creación', async () => {
    const w = mountModal()
    const form = getForm()
    setInputValue(form, 'Test habit')
    await w.vm.$nextTick()
    setTextareaValue(form, 'Mi descripción')
    await w.vm.$nextTick()
    form.requestSubmit()
    await flushPromises()
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Mi descripción' })
    )
  })

  it('envía description null cuando está vacía', async () => {
    const w = mountModal()
    const form = getForm()
    setInputValue(form, 'Test habit')
    await w.vm.$nextTick()
    form.requestSubmit()
    await flushPromises()
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({ description: null })
    )
  })

  it('renderiza el input de repeticiones por día con default 1', () => {
    mountModal()
    const input = getForm().querySelector<HTMLInputElement>("input[type='number']")
    expect(input).toBeTruthy()
    expect(input!.value).toBe('1')
    expect(input!.min).toBe('1')
    expect(input!.max).toBe('20')
  })

  it('envía frequency con target_per_period del input en creación', async () => {
    const w = mountModal()
    const form = getForm()
    setInputValue(form, 'Tomar 8 vasos de agua')
    setNumberValue(form, '8')
    await w.vm.$nextTick()
    form.requestSubmit()
    await flushPromises()
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: expect.objectContaining({
          type: 'daily',
          target_per_period: 8,
        }),
      })
    )
  })

  it('envía target_per_period 1 cuando el input queda vacío (default)', async () => {
    const w = mountModal()
    const form = getForm()
    setInputValue(form, 'Hábito simple')
    setNumberValue(form, '')
    await w.vm.$nextTick()
    form.requestSubmit()
    await flushPromises()
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: expect.objectContaining({ target_per_period: 1 }),
      })
    )
  })

  it('clampa el mínimo (0 → 1) al crear', async () => {
    const w = mountModal()
    const form = getForm()
    setInputValue(form, 'Clamp test')
    setNumberValue(form, '0')
    await w.vm.$nextTick()
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: expect.objectContaining({ target_per_period: 1 }),
      })
    )
  })

  it('clampa el máximo (99 → 20) al crear', async () => {
    const w = mountModal()
    const form = getForm()
    setInputValue(form, 'Clamp test')
    setNumberValue(form, '99')
    await w.vm.$nextTick()
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    await flushPromises()
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: expect.objectContaining({ target_per_period: 20 }),
      })
    )
  })

  it('acepta el límite superior (20) al crear', async () => {
    const w = mountModal()
    const form = getForm()
    setInputValue(form, 'Limite')
    setNumberValue(form, '20')
    await w.vm.$nextTick()
    form.requestSubmit()
    await flushPromises()
    expect(habitsMock.createHabit).toHaveBeenCalledWith(
      expect.objectContaining({
        frequency: expect.objectContaining({ target_per_period: 20 }),
      })
    )
  })

  describe('modo edición', () => {
    it('abre con los valores del hábito pre-llenados', async () => {
      habitsState.value = [
        {
          id: 'h1',
          name: 'Meditar',
          color: '#5e6ad2',
          icon: 'footprints',
          frequency: { type: 'daily', target_per_period: 1 },
        },
      ]
      uiState.createHabitOpen.value = false
      uiState.editingHabitId.value = null
      mountModal()
      await flushPromises()
      uiState.editingHabitId.value = 'h1'
      uiState.createHabitOpen.value = true
      await flushPromises()
      const input = getForm().querySelector<HTMLInputElement>('input')!
      expect(input.value).toBe('Meditar')
      const pressed = document.body.querySelector<HTMLButtonElement>(
        "button[aria-pressed='true'][aria-label='Lavanda']"
      )
      expect(pressed).toBeTruthy()
    })

    it('pre-llena el input de repeticiones con el target del hábito', async () => {
      habitsState.value = [
        {
          id: 'h1',
          name: 'Tomar agua',
          color: '#5e6ad2',
          icon: 'footprints',
          frequency: { type: 'daily', target_per_period: 8 },
        },
      ]
      uiState.createHabitOpen.value = false
      uiState.editingHabitId.value = null
      mountModal()
      await flushPromises()
      uiState.editingHabitId.value = 'h1'
      uiState.createHabitOpen.value = true
      await flushPromises()
      const input = getForm().querySelector<HTMLInputElement>("input[type='number']")
      expect(input!.value).toBe('8')
    })

    it('submit en edición envía el target modificado en updateHabit', async () => {
      habitsState.value = [
        {
          id: 'h1',
          name: 'Tomar agua',
          color: '#5e6ad2',
          icon: 'footprints',
          frequency: { type: 'daily', target_per_period: 8 },
        },
      ]
      uiState.createHabitOpen.value = false
      uiState.editingHabitId.value = null
      const w = mountModal()
      await flushPromises()
      uiState.editingHabitId.value = 'h1'
      uiState.createHabitOpen.value = true
      await flushPromises()
      const form = getForm()
      setNumberValue(form, '10')
      await w.vm.$nextTick()
      form.requestSubmit()
      await flushPromises()
      expect(habitsMock.updateHabit).toHaveBeenCalledWith(
        'h1',
        expect.objectContaining({
          frequency: expect.objectContaining({ target_per_period: 10 }),
        })
      )
    })

    it('preserva la frecuencia no-diaria (weekly/interval) al editar', async () => {
      habitsState.value = [
        {
          id: 'h1',
          name: 'Ejercicio',
          color: '#5e6ad2',
          icon: 'footprints',
          frequency: { type: 'weekly', target_per_period: 3 },
        },
      ]
      uiState.createHabitOpen.value = false
      uiState.editingHabitId.value = null
      mountModal()
      await flushPromises()
      uiState.editingHabitId.value = 'h1'
      uiState.createHabitOpen.value = true
      await flushPromises()
      expect(getForm().querySelector("input[type='number']")).toBeNull()
      getForm().requestSubmit()
      await flushPromises()
      expect(habitsMock.updateHabit).toHaveBeenCalledWith(
        'h1',
        expect.objectContaining({
          frequency: expect.objectContaining({ type: 'weekly', target_per_period: 3 }),
        })
      )
    })

    it('submit en edición llama updateHabit con los valores nuevos', async () => {
      habitsState.value = [
        {
          id: 'h1',
          name: 'Meditar',
          color: '#5e6ad2',
          icon: 'footprints',
          frequency: { type: 'daily', target_per_period: 1 },
        },
      ]
      uiState.createHabitOpen.value = false
      uiState.editingHabitId.value = null
      const w = mountModal()
      await flushPromises()
      uiState.editingHabitId.value = 'h1'
      uiState.createHabitOpen.value = true
      await flushPromises()
      const form = getForm()
      setInputValue(form, 'Otro nombre')
      await w.vm.$nextTick()
      const rojo = document.body.querySelector<HTMLButtonElement>("button[aria-label='Rojo']")!
      rojo.click()
      await w.vm.$nextTick()
      form.requestSubmit()
      await flushPromises()
      expect(habitsMock.updateHabit).toHaveBeenCalledWith(
        'h1',
        expect.objectContaining({
          name: 'Otro nombre',
          color: '#eb5757',
          icon: expect.any(String),
        })
      )
    })

    it('pre-llena la descripción en modo edición', async () => {
      habitsState.value = [
        {
          id: 'h1',
          name: 'Meditar',
          description: 'Respirar profundo',
          color: '#5e6ad2',
          icon: 'footprints',
          frequency: { type: 'daily', target_per_period: 1 },
        },
      ]
      uiState.createHabitOpen.value = false
      uiState.editingHabitId.value = null
      mountModal()
      await flushPromises()
      uiState.editingHabitId.value = 'h1'
      uiState.createHabitOpen.value = true
      await flushPromises()
      const textarea = getForm().querySelector<HTMLTextAreaElement>('textarea')!
      expect(textarea.value).toBe('Respirar profundo')
    })

    it('incluye description en el updateHabit', async () => {
      habitsState.value = [
        {
          id: 'h1',
          name: 'Meditar',
          description: 'Antes',
          color: '#5e6ad2',
          icon: 'footprints',
          frequency: { type: 'daily', target_per_period: 1 },
        },
      ]
      uiState.createHabitOpen.value = false
      uiState.editingHabitId.value = null
      const w = mountModal()
      await flushPromises()
      uiState.editingHabitId.value = 'h1'
      uiState.createHabitOpen.value = true
      await flushPromises()
      const form = getForm()
      setTextareaValue(form, 'Después')
      await w.vm.$nextTick()
      form.requestSubmit()
      await flushPromises()
      expect(habitsMock.updateHabit).toHaveBeenCalledWith(
        'h1',
        expect.objectContaining({ description: 'Después' })
      )
    })

    it('submit en edición cierra el modal (createHabitOpen=false)', async () => {
      habitsState.value = [
        {
          id: 'h1',
          name: 'Meditar',
          color: '#5e6ad2',
          icon: 'footprints',
          frequency: { type: 'daily', target_per_period: 1 },
        },
      ]
      uiState.createHabitOpen.value = false
      uiState.editingHabitId.value = null
      const w = mountModal()
      await flushPromises()
      uiState.editingHabitId.value = 'h1'
      uiState.createHabitOpen.value = true
      await flushPromises()
      const form = getForm()
      setInputValue(form, 'X')
      await w.vm.$nextTick()
      form.requestSubmit()
      await flushPromises()
      expect(uiState.createHabitOpen.value).toBe(false)
      expect(uiState.editingHabitId.value).toBe(null)
    })
  })
})
