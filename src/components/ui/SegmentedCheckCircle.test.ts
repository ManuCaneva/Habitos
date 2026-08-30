import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SegmentedCheckCircle from './SegmentedCheckCircle.vue'

describe('SegmentedCheckCircle', () => {
  describe('target > 1 (segmentado)', () => {
    it('renderiza target segmentos de anillo y enciende count de ellos', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 8, count: 3, color: '#5e6ad2' } })
      const segments = w.findAll("[data-testid='segment']")
      expect(segments).toHaveLength(8)
      const lit = segments.filter((s) => s.attributes('stroke') === '#5e6ad2')
      expect(lit).toHaveLength(3)
      expect(w.find('[data-testid="progress-ring"]').exists()).toBe(true)
    })

    it('mantiene todos los segmentos apagados y muestra Plus sin progreso', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 0, color: '#5e6ad2' } })
      const segments = w.findAll("[data-testid='segment']")
      expect(segments).toHaveLength(4)
      expect(w.find("[data-testid='circle-plus']").exists()).toBe(true)
      expect(segments.filter((s) => s.attributes('stroke') === '#5e6ad2')).toHaveLength(0)
    })

    it('los segmentos encendidos usan el color del hábito', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 2, color: '#eb5757' } })
      const lit = w
        .findAll("[data-testid='segment']")
        .filter((s) => s.attributes('stroke') === '#eb5757')
      expect(lit).toHaveLength(2)
      for (const s of lit) {
        expect(s.attributes('stroke')).toBe('#eb5757')
      }
    })

    it('muestra los segmentos apagados con el color del hábito atenuado', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 2, color: '#eb5757' } })
      const segments = w.findAll("[data-testid='segment']")

      expect(segments).toHaveLength(4)
      expect(segments[0].attributes('stroke')).toBe('#eb5757')
      expect(segments[1].attributes('stroke')).toBe('#eb5757')
      expect(segments[2].attributes('stroke')).toBe('rgba(235, 87, 87, 0.2)')
      expect(segments[3].attributes('stroke')).toBe('rgba(235, 87, 87, 0.2)')
    })

    it('muestra Plus en el centro mientras está parcial', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 8, count: 3, color: '#5e6ad2' } })
      expect(w.find("[data-testid='circle-check']").exists()).toBe(false)
      expect(w.find("[data-testid='circle-plus']").exists()).toBe(true)
    })

    it('mantiene el anillo decorativo y el botón como única superficie de acción', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 2, color: '#5e6ad2' } })
      expect(w.find('[data-testid="progress-ring"]').attributes('aria-hidden')).toBe('true')
      expect(w.findAll('button')).toHaveLength(2)
    })

    it('al llenarse se funde en un círculo sólido con Check (idéntico al binario)', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 8, count: 8, color: '#5e6ad2' } })
      expect(w.find("[data-testid='circle-check']").exists()).toBe(true)
      expect(w.find("[data-testid='segment']").exists()).toBe(false)
      const btn = w.find("[data-testid='checkin-button']")
      expect(btn.attributes('style')).toContain('#5e6ad2')
    })

    it('trata un count por encima del target como completado', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 6, color: '#5e6ad2' } })
      expect(w.find("[data-testid='circle-check']").exists()).toBe(true)
      expect(w.find("[data-testid='progress-ring']").exists()).toBe(false)
    })

    it('conserva un segmento por repetición hasta el target máximo', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 20, count: 19, color: '#5e6ad2' } })
      expect(w.findAll("[data-testid='segment']")).toHaveLength(20)
      expect(
        w.findAll("[data-testid='segment']").filter((s) => s.attributes('stroke') === '#5e6ad2')
      ).toHaveLength(19)
      expect(w.find("[data-testid='circle-plus']").exists()).toBe(true)
    })

    it('click en el círculo emite increment cuando no está lleno', async () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 2, color: '#5e6ad2' } })
      await w.find("[data-testid='checkin-button']").trigger('click')
      expect(w.emitted('increment')).toHaveLength(1)
      expect(w.emitted('reset')).toBeUndefined()
      expect(w.emitted('decrement')).toBeUndefined()
    })

    it('click en el círculo lleno emite reset', async () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 4, color: '#5e6ad2' } })
      await w.find("[data-testid='checkin-button']").trigger('click')
      expect(w.emitted('reset')).toHaveLength(1)
      expect(w.emitted('increment')).toBeUndefined()
    })

    it('botón - emite decrement cuando count > 0', async () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 2, color: '#5e6ad2' } })
      await w.find("[data-testid='decrement-button']").trigger('click')
      expect(w.emitted('decrement')).toHaveLength(1)
    })

    it('no muestra botón - cuando count = 0', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 4, count: 0, color: '#5e6ad2' } })
      expect(w.find("[data-testid='decrement-button']").exists()).toBe(false)
    })
  })

  describe('target = 1 (binario)', () => {
    it('renderiza Check cuando count >= 1', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 1, count: 1, color: '#5e6ad2' } })
      expect(w.find("[data-testid='circle-check']").exists()).toBe(true)
      expect(w.find("[data-testid='segment']").exists()).toBe(false)
      expect(w.find("[data-testid='decrement-button']").exists()).toBe(false)
    })

    it('renderiza Plus cuando count = 0', () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 1, count: 0, color: '#5e6ad2' } })
      expect(w.find("[data-testid='circle-plus']").exists()).toBe(true)
    })

    it('click emite increment cuando está vacío', async () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 1, count: 0, color: '#5e6ad2' } })
      await w.find("[data-testid='checkin-button']").trigger('click')
      expect(w.emitted('increment')).toHaveLength(1)
    })

    it('click emite decrement cuando está lleno', async () => {
      const w = mount(SegmentedCheckCircle, { props: { target: 1, count: 1, color: '#5e6ad2' } })
      await w.find("[data-testid='checkin-button']").trigger('click')
      expect(w.emitted('decrement')).toHaveLength(1)
    })
  })
})
