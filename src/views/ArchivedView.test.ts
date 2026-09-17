import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import ArchivedView from './ArchivedView.vue'
import { hasRawPaletteColor } from '@/test/colorGuard'

vi.mock('@/stores/habits', () => ({
  useHabitsStore: () => ({
    archivedHabits: [],
  }),
}))

describe('ArchivedView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('main element has h-full and overflow-y-auto', () => {
    const wrapper = mount(ArchivedView)
    const main = wrapper.find('main')
    expect(main.exists()).toBe(true)
    expect(main.classes()).toContain('h-full')
    expect(main.classes()).toContain('overflow-y-auto')
  })

  it('renderiza header con eyebrow y título', () => {
    const wrapper = mount(ArchivedView)
    expect(wrapper.find('.text-eyebrow').text()).toBe('Biblioteca')
    expect(wrapper.find('h2').text()).toBe('Archivados')
  })

  it('el empty state muestra el mensaje sin colores crudos', () => {
    const wrapper = mount(ArchivedView)
    expect(wrapper.text()).toContain('No tenés hábitos archivados.')
    expect(hasRawPaletteColor(wrapper.html())).toBe(false)
  })
})
