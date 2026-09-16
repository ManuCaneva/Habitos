import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Badge from './Badge.vue'

describe('Badge', () => {
  it('renderiza el contenido en un span truncable que puede encoger', () => {
    const wrapper = mount(Badge, { slots: { default: 'Diario' } })
    const label = wrapper.find('.truncate')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Diario')
    expect(label.classes()).toContain('min-w-0')
  })

  it('el punto indicador no se comprime', () => {
    const wrapper = mount(Badge, { props: { dot: true }, slots: { default: 'Diario' } })
    expect(wrapper.find('.shrink-0').exists()).toBe(true)
  })

  it('el badge puede encoger por debajo de su contenido', () => {
    const wrapper = mount(Badge, { slots: { default: 'Diario' } })
    expect(wrapper.classes()).toContain('min-w-0')
  })
})
