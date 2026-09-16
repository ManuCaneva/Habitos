import { describe, it, expect } from 'vitest'
import { COLS, ROWS, itemZIndex } from './grid'

describe('itemZIndex', () => {
  it('apila un item por encima del vecino de su derecha (la cruz sobresale hacia la derecha)', () => {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS - 1; x++) {
        expect(itemZIndex(x, y)).toBeGreaterThan(itemZIndex(x + 1, y))
      }
    }
  })

  it('apila un item por encima del vecino de arriba (la cruz sobresale hacia arriba)', () => {
    for (let y = 0; y < ROWS - 1; y++) {
      for (let x = 0; x < COLS; x++) {
        expect(itemZIndex(x, y + 1)).toBeGreaterThan(itemZIndex(x, y))
      }
    }
  })

  it('devuelve un valor positivo en toda la grilla', () => {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        expect(itemZIndex(x, y)).toBeGreaterThan(0)
      }
    }
  })

  it('asigna un valor único a cada celda de la grilla', () => {
    const values = new Set<number>()
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        values.add(itemZIndex(x, y))
      }
    }
    expect(values.size).toBe(COLS * ROWS)
  })
})
