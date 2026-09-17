import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Text from './Text.vue'

describe('Text', () => {
  it('renderiza un <p> por default con variante body y color ink', () => {
    const wrapper = mount(Text, { slots: { default: 'hola' } })
    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.classes()).toContain('text-body')
    expect(wrapper.classes()).toContain('text-ink')
  })

  it('as=span cambia el tag', () => {
    const wrapper = mount(Text, { props: { as: 'span' }, slots: { default: 'x' } })
    expect(wrapper.element.tagName).toBe('SPAN')
  })

  it('mapea cada color a su token', () => {
    const cases = [
      ['muted', 'text-ink-muted'],
      ['subtle', 'text-ink-subtle'],
      ['tertiary', 'text-ink-tertiary'],
      ['primary', 'text-primary'],
      ['success', 'text-success'],
    ] as const
    for (const [color, cls] of cases) {
      const wrapper = mount(Text, { props: { color }, slots: { default: 'x' } })
      expect(wrapper.classes()).toContain(cls)
    }
  })

  it('mapea cada peso a una utilidad válida de Tailwind', () => {
    const cases = [
      ['400', 'font-normal'],
      ['500', 'font-medium'],
      ['600', 'font-semibold'],
      ['700', 'font-bold'],
    ] as const
    for (const [weight, cls] of cases) {
      const wrapper = mount(Text, { props: { weight }, slots: { default: 'x' } })
      expect(wrapper.classes()).toContain(cls)
    }
  })

  it('no emite clases font-<número> (no existen en Tailwind)', () => {
    const wrapper = mount(Text, { props: { weight: '600' }, slots: { default: 'x' } })
    expect(wrapper.classes().some((c) => /^font-\d+$/.test(c))).toBe(false)
  })

  it('sin weight no agrega ninguna clase font-*', () => {
    const wrapper = mount(Text, { slots: { default: 'x' } })
    expect(wrapper.classes().some((c) => c.startsWith('font-') && c !== 'font-mono')).toBe(false)
  })

  it('mono agrega font-mono', () => {
    const wrapper = mount(Text, { props: { mono: true }, slots: { default: 'x' } })
    expect(wrapper.classes()).toContain('font-mono')
  })
})
