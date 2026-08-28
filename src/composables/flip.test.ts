import { describe, it, expect } from 'vitest'
import { flipTransform, flipNeedsAnimation, FLIP_DURATION_MS, FLIP_EASING } from './flip'

describe('flipTransform', () => {
  it('devuelve un transform de translación pura cuando solo cambia la posición', () => {
    const first = { left: 150, top: 90, width: 600, height: 240 }
    const last = { left: 100, top: 60, width: 600, height: 240 }
    expect(flipTransform(first, last)).toBe('translate(50px, 30px) scale(1, 1)')
  })

  it('agrega escala cuando cambia el tamaño (resize)', () => {
    const first = { left: 0, top: 0, width: 750, height: 300 }
    const last = { left: 0, top: 0, width: 800, height: 300 }
    expect(flipTransform(first, last)).toBe('translate(0px, 0px) scale(0.9375, 1)')
  })

  it('es identidad cuando first y last son iguales', () => {
    const rect = { left: 100, top: 60, width: 600, height: 240 }
    expect(flipTransform(rect, rect)).toBe('translate(0px, 0px) scale(1, 1)')
  })

  it('nunca escala por cero (evita NaN en contenedores sin tamaño)', () => {
    const first = { left: 0, top: 0, width: 0, height: 0 }
    const last = { left: 0, top: 0, width: 0, height: 0 }
    expect(flipTransform(first, last)).toBe('translate(0px, 0px) scale(1, 1)')
  })

  it('expone duración y easing consistentes para el vocabulario de motion', () => {
    expect(FLIP_DURATION_MS).toBeGreaterThanOrEqual(150)
    expect(FLIP_DURATION_MS).toBeLessThanOrEqual(200)
    expect(FLIP_EASING).toBeTruthy()
  })

  it('flipNeedsAnimation: false cuando first y last coinciden', () => {
    const rect = { left: 100, top: 60, width: 600, height: 240 }
    expect(flipNeedsAnimation(rect, rect)).toBe(false)
  })

  it('flipNeedsAnimation: true cuando hay diferencia de posición o tamaño', () => {
    const first = { left: 100, top: 60, width: 600, height: 240 }
    const moved = { left: 200, top: 60, width: 600, height: 240 }
    const resized = { left: 100, top: 60, width: 700, height: 240 }
    expect(flipNeedsAnimation(first, moved)).toBe(true)
    expect(flipNeedsAnimation(first, resized)).toBe(true)
  })
})
