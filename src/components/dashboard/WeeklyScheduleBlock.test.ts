import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeeklyScheduleBlock from './WeeklyScheduleBlock.vue'
import { blockColorTint } from '@/lib/scheduleColors'
import { hasRawPaletteColor } from '@/test/colorGuard'

vi.mock('@/stores/weeklySchedule', () => ({
  useWeeklyScheduleStore: () => ({}),
}))

vi.mock('@/lib/scheduleColors', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/scheduleColors')>()
  return { ...actual, blockColorTint: vi.fn(actual.blockColorTint) }
})

describe('WeeklyScheduleBlock', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renderiza el título y aplica el color de borde atenuado', () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: {
        title: 'Gimnasio',
        color: 'lavender',
      },
    })

    expect(wrapper.text()).toContain('Gimnasio')
    expect(blockColorTint).toHaveBeenCalledWith('lavender', 0.8)
  })

  it('permite que el título envuelva en varias líneas en vez de truncarse', () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: {
        title: 'Administración de Sistemas de Información',
        color: 'lavender',
      },
    })

    const title = wrapper.find('.schedule-block-title')
    expect(title.exists()).toBe(true)
    expect(title.classes()).not.toContain('truncate')
    expect(title.classes()).toContain('break-words')
    expect(wrapper.classes()).not.toContain('truncate')
  })

  it('usa el tinte del color seleccionado como fondo del bloque', () => {
    mount(WeeklyScheduleBlock, {
      props: {
        title: 'Gimnasio',
        color: 'lavender',
      },
    })

    expect(blockColorTint).toHaveBeenCalledWith('lavender', 0.16)
    expect(blockColorTint).toHaveReturnedWith('rgb(var(--color-block-lavender) / 0.16)')
  })

  it('centra el título dentro del bloque', () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: {
        title: 'Gimnasio',
        color: 'lavender',
      },
    })

    expect(wrapper.classes()).toContain('items-center')
    expect(wrapper.classes()).toContain('justify-center')
    expect(wrapper.classes()).toContain('text-center')
    expect(wrapper.classes()).not.toContain('text-left')
  })

  it('emite click cuando el usuario hace click en el bloque', async () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: {
        title: 'Gimnasio',
        color: 'lavender',
      },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('no usa colores de paleta cruda de Tailwind', () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: { title: 'Gimnasio', color: 'lavender' },
    })
    expect(hasRawPaletteColor(wrapper.html())).toBe(false)
  })
})
