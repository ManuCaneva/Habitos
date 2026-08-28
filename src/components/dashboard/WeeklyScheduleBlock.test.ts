import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import WeeklyScheduleBlock from './WeeklyScheduleBlock.vue'

vi.mock('@/stores/weeklySchedule', () => ({
  useWeeklyScheduleStore: () => ({}),
}))

describe('WeeklyScheduleBlock', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renderiza el título y clase de color correspondiente', () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: {
        title: 'Gimnasio',
        color: 'lavender',
        dayOfWeek: 1,
        startMinutes: 360,
        endMinutes: 420,
      },
    })

    expect(wrapper.text()).toContain('Gimnasio')
    expect((wrapper.element as HTMLElement).style.borderColor).toBe('#5e6ad2')
  })

  it('emite click cuando el usuario hace click en el bloque', async () => {
    const wrapper = mount(WeeklyScheduleBlock, {
      props: {
        title: 'Gimnasio',
        color: 'lavender',
        dayOfWeek: 1,
        startMinutes: 360,
        endMinutes: 420,
      },
    })

    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
