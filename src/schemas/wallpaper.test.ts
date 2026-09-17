import { describe, expect, it } from 'vitest'
import {
  WallpaperSettingsSchema,
  parseWallpaperSettingsJson,
  defaultWallpaperSettings,
} from './wallpaper'

const pngDataUrl =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

describe('WallpaperSettingsSchema', () => {
  it('acepta settings con data URL de imagen', () => {
    const result = WallpaperSettingsSchema.parse({ dataUrl: pngDataUrl })
    expect(result.dataUrl).toBe(pngDataUrl)
  })

  it('tiene dataUrl null por defecto', () => {
    const result = WallpaperSettingsSchema.parse({})
    expect(result.dataUrl).toBeNull()
    expect(defaultWallpaperSettings.dataUrl).toBeNull()
  })

  it('acepta dataUrl null explícito', () => {
    const result = WallpaperSettingsSchema.parse({ dataUrl: null })
    expect(result.dataUrl).toBeNull()
  })

  it('rechaza un string arbitrario que no es data URL', () => {
    expect(() =>
      WallpaperSettingsSchema.parse({ dataUrl: 'https://example.com/fondo.png' })
    ).toThrow()
  })

  it('rechaza una data URL que no es de imagen', () => {
    expect(() =>
      WallpaperSettingsSchema.parse({ dataUrl: 'data:text/html;base64,PGgxPmgvbGk8L2gxPg==' })
    ).toThrow()
    expect(() =>
      WallpaperSettingsSchema.parse({ dataUrl: 'data:application/pdf;base64,JVBERi0=' })
    ).toThrow()
  })

  it('rechaza tipos que no recibe el schema', () => {
    expect(() => WallpaperSettingsSchema.parse({ dataUrl: 42 })).toThrow()
    expect(() => WallpaperSettingsSchema.parse(null)).toThrow()
  })
})

describe('parseWallpaperSettingsJson', () => {
  it('parsea JSON válido con data URL de imagen', () => {
    const json = JSON.stringify({ dataUrl: pngDataUrl })
    expect(parseWallpaperSettingsJson(json)).toEqual({ dataUrl: pngDataUrl })
  })

  it('devuelve el default con JSON null', () => {
    expect(parseWallpaperSettingsJson(null)).toEqual(defaultWallpaperSettings)
  })

  it('devuelve el default con JSON corrupto o inválido, sin lanzar', () => {
    expect(parseWallpaperSettingsJson('{no es json')).toEqual(defaultWallpaperSettings)
    expect(parseWallpaperSettingsJson(JSON.stringify({ dataUrl: 'nope' }))).toEqual(
      defaultWallpaperSettings
    )
    expect(parseWallpaperSettingsJson(JSON.stringify({ dataUrl: 123 }))).toEqual(
      defaultWallpaperSettings
    )
  })
})
