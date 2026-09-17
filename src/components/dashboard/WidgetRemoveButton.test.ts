import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import WidgetRemoveButton from './WidgetRemoveButton.vue'
import { hasRawPaletteColor } from '@/test/colorGuard'

describe('WidgetRemoveButton', () => {
  it('renderiza un botón con aria-label', () => {
    const wrapper = mount(WidgetRemoveButton, {
      props: { widgetId: 'habits' },
    })
    const btn = wrapper.find('button')
    expect(btn.exists()).toBe(true)
    expect(btn.attributes('aria-label')).toBeTruthy()
  })

  it('se centra sobre el vértice superior derecho del widget para no pisar el contenido', () => {
    const wrapper = mount(WidgetRemoveButton, {
      props: { widgetId: 'habits' },
    })
    const btn = wrapper.find('button')
    expect(btn.classes()).toContain('absolute')
    expect(btn.classes()).toContain('-right-3')
    expect(btn.classes()).toContain('-top-3')
    expect(btn.classes()).not.toContain('right-1')
    expect(btn.classes()).not.toContain('top-1')
  })

  it('tiene contorno y fondo propios, sin fundirse con la esquina del widget', () => {
    const wrapper = mount(WidgetRemoveButton, {
      props: { widgetId: 'habits' },
    })
    const classes = wrapper.find('button').classes()
    expect(classes).toContain('border')
    expect(classes).toContain('border-hairline-strong')
    expect(classes).toContain('bg-surface-2')
    expect(classes).toContain('rounded-full')
  })

  it('emite remove con el widgetId al hacer click', async () => {
    const wrapper = mount(WidgetRemoveButton, {
      props: { widgetId: 'tasks' },
    })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('remove')).toHaveLength(1)
    expect(wrapper.emitted('remove')![0]).toEqual(['tasks'])
  })

  it('no usa colores de paleta cruda de Tailwind', () => {
    const wrapper = mount(WidgetRemoveButton, { props: { widgetId: 'habits' } })
    expect(hasRawPaletteColor(wrapper.html())).toBe(false)
  })
})
