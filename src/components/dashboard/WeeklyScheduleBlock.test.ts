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
      },
    })

    expect(wrapper.text()).toContain('Gimnasio')
    expect((wrapper.element as HTMLElement).style.borderColor).toBe(
      'rgb(var(--color-block-lavender))'
    )
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
})
