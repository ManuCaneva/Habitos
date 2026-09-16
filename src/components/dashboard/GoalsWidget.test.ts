import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import GoalsWidget from './GoalsWidget.vue'
import { hasRawPaletteColor } from '@/test/colorGuard'

describe('GoalsWidget', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("should render with data-testid='goals-widget'", () => {
    const wrapper = mount(GoalsWidget)
    const widget = wrapper.find("[data-testid='goals-widget']")
    expect(widget.exists()).toBe(true)
  })

  it("should use Container with variant='default' and padding='none'", () => {
    const wrapper = mount(GoalsWidget)
    const widget = wrapper.find("[data-testid='goals-widget']")
    expect(widget.classes()).toContain('bg-surface-1')
    expect(widget.classes()).toContain('border')
  })

  it('should have container-type: size style to allow height compaction', () => {
    const wrapper = mount(GoalsWidget)
    const widget = wrapper.find("[data-testid='goals-widget']")
    expect(widget.attributes('style')).toContain('container-type: size')
  })

  it('should render GoalsListView', () => {
    const wrapper = mount(GoalsWidget)
    const listView = wrapper.findComponent({ name: 'GoalsListView' })
    expect(listView.exists()).toBe(true)
  })

  it('no muestra el eyebrow «Seguimiento»', () => {
    const wrapper = mount(GoalsWidget)
    expect(wrapper.find('.text-eyebrow').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Seguimiento')
  })

  it('sigue mostrando el título «Objetivos»', () => {
    const wrapper = mount(GoalsWidget)
    expect(wrapper.find('.text-card-title').text()).toBe('Objetivos')
  })

  it('no usa colores de paleta cruda de Tailwind', () => {
    const wrapper = mount(GoalsWidget)
    expect(hasRawPaletteColor(wrapper.html())).toBe(false)
  })
})
