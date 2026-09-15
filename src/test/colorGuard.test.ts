import { describe, it, expect } from 'vitest'
import { hasRawPaletteColor } from './colorGuard'

describe('hasRawPaletteColor', () => {
  it('detecta colores de paleta cruda con shade', () => {
    expect(hasRawPaletteColor('<div class="text-red-500">')).toBe(true)
    expect(hasRawPaletteColor('<span class="bg-blue-600">')).toBe(true)
    expect(hasRawPaletteColor('<span class="border-emerald-400">')).toBe(true)
  })

  it('detecta white y black crudos', () => {
    expect(hasRawPaletteColor('<div class="text-white">')).toBe(true)
    expect(hasRawPaletteColor('<div class="bg-black">')).toBe(true)
    expect(hasRawPaletteColor('<div class="ring-white">')).toBe(true)
    expect(hasRawPaletteColor('<div class="ring-offset-white">')).toBe(true)
  })

  it('no marca tokens del sistema', () => {
    expect(hasRawPaletteColor('<div class="text-ink-muted">')).toBe(false)
    expect(hasRawPaletteColor('<div class="bg-surface-2">')).toBe(false)
    expect(hasRawPaletteColor('<div class="text-on-primary">')).toBe(false)
    expect(hasRawPaletteColor('<div class="bg-canvas">')).toBe(false)
    expect(hasRawPaletteColor('<div class="bg-accent-green-tint">')).toBe(false)
    expect(hasRawPaletteColor('<div class="border-hairline-strong">')).toBe(false)
  })
})
