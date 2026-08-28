import { describe, it, expect } from 'vitest'
import { widgets, getWidgetById } from './dashboardWidgets'

describe('dashboardWidgets', () => {
  it('expone el widget de hábitos', () => {
    const widget = getWidgetById('habits')
    expect(widget).toBeDefined()
    expect(widget?.id).toBe('habits')
    expect(widget?.title).toBe('Hábitos')
  })

  it('expone el widget de cronograma semanal', () => {
    const widget = getWidgetById('weekly-schedule')
    expect(widget).toBeDefined()
    expect(widget?.id).toBe('weekly-schedule')
    expect(widget?.title).toBe('Cronograma Semanal')
  })

  it('cada widget tiene dimensiones por defecto válidas (celdas enteras)', () => {
    widgets.forEach((w) => {
      expect(w.minW).toBeGreaterThan(0)
      expect(w.minH).toBeGreaterThan(0)
      expect(w.defaultW).toBeGreaterThan(0)
      expect(w.defaultH).toBeGreaterThan(0)
      expect(w.defaultW).toBeLessThanOrEqual(12)
      expect(w.defaultH).toBeLessThanOrEqual(10)
      expect(w.defaultW).toBeGreaterThanOrEqual(w.minW)
      expect(w.defaultH).toBeGreaterThanOrEqual(w.minH)
    })
  })

  it('widget de hábitos tiene default 6 celdas de ancho × 4 de alto', () => {
    const widget = getWidgetById('habits')!
    expect(widget.defaultW).toBe(6)
    expect(widget.defaultH).toBe(4)
  })

  it('widget de hábitos permite resize pequeño (mínimo 1 celda de ancho y alto)', () => {
    const widget = getWidgetById('habits')!
    expect(widget.minW).toBe(1)
    expect(widget.minH).toBe(1)
  })

  it('devuelve undefined para un id desconocido', () => {
    expect(getWidgetById('unknown')).toBeUndefined()
  })
})
