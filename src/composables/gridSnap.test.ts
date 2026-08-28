import { describe, it, expect } from 'vitest'
import { pxToCells } from './gridSnap'
import { COLS, ROWS } from '@/lib/grid'

describe('pxToCells', () => {
  const containerWidth = 1200
  const containerHeight = 600

  it('convierte píxeles a celdas enteras', () => {
    const result = pxToCells(200, 120, 300, 120, containerWidth, containerHeight)
    expect(result).toEqual({ x: 2, y: 2, w: 3, h: 2 })
  })

  it('redondea a la celda más cercana', () => {
    const result = pxToCells(250, 70, 249, 90, containerWidth, containerHeight)
    expect(result.x).toBe(3) // 250/100 = 2.5 → 3
    expect(result.y).toBe(1) // 70/60 = 1.17 → 1
    expect(result.w).toBe(2) // 249/100 = 2.49 → 2
    expect(result.h).toBe(2) // 90/60 = 1.5 → 2
  })

  it('clampea w/h a un mínimo de 1 celda', () => {
    const result = pxToCells(0, 0, 10, 10, containerWidth, containerHeight)
    expect(result.w).toBe(1)
    expect(result.h).toBe(1)
  })

  it('respeta minW/minH pasados', () => {
    const result = pxToCells(0, 0, 100, 100, containerWidth, containerHeight, {
      minW: 5,
      minH: 4,
    })
    expect(result.w).toBe(5)
    expect(result.h).toBe(4)
  })

  it('clampa para que x+w no exceda COLS', () => {
    const result = pxToCells(1100, 0, 400, 100, containerWidth, containerHeight)
    expect(result.x + result.w).toBeLessThanOrEqual(COLS)
    expect(result.x).toBe(COLS - 4)
  })

  it('clampa para que y+h no exceda ROWS', () => {
    const result = pxToCells(0, 550, 100, 400, containerWidth, containerHeight)
    expect(result.y + result.h).toBeLessThanOrEqual(ROWS)
    expect(result.y).toBe(ROWS - 7)
  })

  it('valores negativos se clampean a 0', () => {
    const result = pxToCells(-100, -100, 100, 80, containerWidth, containerHeight)
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
  })
})
