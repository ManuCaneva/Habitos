import { describe, it, expect } from 'vitest'
import { hasRawPaletteColor, hasHardcodedColor } from './colorGuard'

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

describe('hasHardcodedColor', () => {
  it('detecta hex hardcodeados de 3, 6 y 8 dígitos', () => {
    expect(hasHardcodedColor(':style="{ color: \'#fff\' }"')).toBe(true)
    expect(hasHardcodedColor('backgroundColor: #6e56cf')).toBe(true)
    expect(hasHardcodedColor('background: #01010280')).toBe(true)
  })

  it('detecta rgb/rgba numéricos literales', () => {
    expect(hasHardcodedColor('rgb(110, 86, 207)')).toBe(true)
    expect(hasHardcodedColor('rgba(0, 0, 0, 0.5)')).toBe(true)
  })

  it('detecta clases de paleta cruda', () => {
    expect(hasHardcodedColor('<div class="text-red-500">')).toBe(true)
    expect(hasHardcodedColor('<div class="bg-black">')).toBe(true)
  })

  it('no marca tokens del sistema ni rgb con variables CSS', () => {
    expect(hasHardcodedColor('rgb(var(--color-primary))')).toBe(false)
    expect(hasHardcodedColor('rgba(var(--color-block-green), 0.4)')).toBe(false)
    expect(hasHardcodedColor('<div class="bg-surface-2 text-ink-muted">')).toBe(false)
    expect(hasHardcodedColor('--color-block-lavender')).toBe(false)
  })
})
