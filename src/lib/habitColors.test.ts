import { describe, it, expect } from 'vitest'
import { shadeFor, intensityFor, HABIT_COLORS, DEFAULT_HABIT_COLOR } from './habitColors'

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

describe('intensityFor', () => {
  it('sin progreso (0/target) devuelve la tonalidad base 0.15', () => {
    expect(intensityFor(0, 20)).toBe(0.15)
  })

  it('con progreso parcial arranca desde la base y sube (1/20 ≈ 0.1925, nunca por debajo de 0.15)', () => {
    const intensity = intensityFor(1, 20)
    expect(intensity).toBeCloseTo(0.1925)
    expect(intensity).toBeGreaterThan(0.15)
  })

  it('a mitad de camino queda en el punto medio del rango [0.15, 1] (4/8 → 0.575)', () => {
    expect(intensityFor(4, 8)).toBeCloseTo(0.575)
  })

  it('progreso completo (target/target) devuelve 1', () => {
    expect(intensityFor(20, 20)).toBe(1)
  })

  it('con target=1 mantiene el comportamiento binario (1/1 → 1)', () => {
    expect(intensityFor(1, 1)).toBe(1)
  })

  it('clampea cuando el count supera al target', () => {
    expect(intensityFor(25, 20)).toBe(1)
  })
})
