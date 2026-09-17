import { describe, it, expect } from 'vitest'
import { widgets, getWidgetById } from './dashboardWidgets'
import { COLS, ROWS } from './grid'

interface Rect {
  x: number
  y: number
  w: number
  h: number
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h
}

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
    expect(widget?.title).toBe('Cronograma Semanal')
  })

  it('expone el widget de Pomodoro con dimensiones compactas', () => {
    const widget = getWidgetById('pomodoro')
    expect(widget).toBeDefined()
    expect(widget?.title).toBe('Pomodoro')
    expect(widget?.defaultW).toBe(4)
    expect(widget?.defaultH).toBe(3)
    expect(widget?.defaultEnabled).toBe(false)
  })

  it('expone el widget de Notas habilitado por defecto', () => {
    const widget = getWidgetById('notes')
    expect(widget).toBeDefined()
    expect(widget?.title).toBe('Notas')
    expect(widget?.defaultEnabled).not.toBe(false)
  })

  it('cada widget tiene dimensiones por defecto válidas (celdas enteras)', () => {
    widgets.forEach((w) => {
      expect(w.minW).toBeGreaterThan(0)
      expect(w.minH).toBeGreaterThan(0)
      expect(w.defaultW).toBeGreaterThan(0)
      expect(w.defaultH).toBeGreaterThan(0)
      expect(w.defaultW).toBeLessThanOrEqual(COLS)
      expect(w.defaultH).toBeLessThanOrEqual(ROWS)
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

  it('los widgets habilitados por defecto no se superponen entre sí', () => {
    const enabled = widgets
      .filter((w) => w.defaultEnabled !== false)
      .map((w) => ({ x: w.defaultX, y: w.defaultY, w: w.defaultW, h: w.defaultH }))
    for (let i = 0; i < enabled.length; i++) {
      for (let j = i + 1; j < enabled.length; j++) {
        expect(overlaps(enabled[i], enabled[j])).toBe(false)
      }
    }
  })

  it('todos los widgets por defecto entran en la grilla 12×10', () => {
    widgets.forEach((w) => {
      expect(w.defaultX).toBeGreaterThanOrEqual(0)
      expect(w.defaultY).toBeGreaterThanOrEqual(0)
      expect(w.defaultX + w.defaultW).toBeLessThanOrEqual(COLS)
      expect(w.defaultY + w.defaultH).toBeLessThanOrEqual(ROWS)
    })
  })
})
