import { describe, it, expect } from 'vitest'
import { shadeFor, HABIT_COLORS, DEFAULT_HABIT_COLOR } from './habitColors'

describe('HABIT_COLORS', () => {
  it('mantiene 8 colores con los mismos nombres', () => {
    expect(HABIT_COLORS).toHaveLength(8)
    expect(HABIT_COLORS.map((c) => c.name)).toEqual([
      'Lavanda',
      'Verde',
      'Amarillo',
      'Rojo',
      'Rosa',
      'Cyan',
      'Naranja',
      'Hueso',
    ])
  })

  it('todos los valores son hex de 6 dígitos', () => {
    for (const color of HABIT_COLORS) {
      expect(color.value).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })

  it('el default es el primer color de la paleta', () => {
    expect(DEFAULT_HABIT_COLOR).toBe(HABIT_COLORS[0].value)
  })

  it('el default es el violeta Attio de la familia cálida', () => {
    expect(DEFAULT_HABIT_COLOR).toBe('#6e56cf')
  })
})

describe('shadeFor', () => {
  it('intensity 1 → color al 100%', () => {
    expect(shadeFor('#5e6ad2', 1)).toBe('rgba(94, 106, 210, 1)')
  })
  it('intensity 0.15 → color al 15%', () => {
    expect(shadeFor('#5e6ad2', 0.15)).toBe('rgba(94, 106, 210, 0.15)')
  })
  it('maneja color sin #', () => {
    expect(shadeFor('5e6ad2', 1)).toBe('rgba(94, 106, 210, 1)')
  })
})
