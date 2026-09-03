import { describe, it, expect } from 'vitest'
import { blockColorVar, blockColorRgb, blockColorTint } from './scheduleColors'

describe('scheduleColors', () => {
  describe('blockColorVar', () => {
    it('mapea cada token de bloque a su CSS var', () => {
      expect(blockColorVar('lavender')).toBe('--color-block-lavender')
      expect(blockColorVar('green')).toBe('--color-block-green')
      expect(blockColorVar('yellow')).toBe('--color-block-yellow')
      expect(blockColorVar('red')).toBe('--color-block-red')
      expect(blockColorVar('pink')).toBe('--color-block-pink')
      expect(blockColorVar('cyan')).toBe('--color-block-cyan')
      expect(blockColorVar('orange')).toBe('--color-block-orange')
      expect(blockColorVar('bone')).toBe('--color-block-bone')
    })
  })

  describe('blockColorRgb', () => {
    it('devuelve el color sólido como rgb(var(...))', () => {
      expect(blockColorRgb('cyan')).toBe('rgb(var(--color-block-cyan))')
      expect(blockColorRgb('lavender')).toBe('rgb(var(--color-block-lavender))')
    })
  })

  describe('blockColorTint', () => {
    it('devuelve el tinte translúcido como rgba(var(...))', () => {
      expect(blockColorTint('lavender', 0.15)).toBe('rgba(var(--color-block-lavender), 0.15)')
      expect(blockColorTint('bone', 1)).toBe('rgba(var(--color-block-bone), 1)')
    })
  })
})
