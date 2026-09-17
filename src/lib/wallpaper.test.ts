import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import {
  MAX_WALLPAPER_BYTES,
  MAX_WALLPAPER_MB,
  validateImageFile,
  fileToDataUrl,
} from './wallpaper'

function fileOfSize(sizeBytes: number, type = 'image/png', name = 'fondo.png'): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

describe('MAX_WALLPAPER_BYTES', () => {
  it('es aproximadamente 4 MB', () => {
    expect(MAX_WALLPAPER_BYTES).toBeGreaterThanOrEqual(3.5 * 1024 * 1024)
    expect(MAX_WALLPAPER_BYTES).toBeLessThanOrEqual(4.5 * 1024 * 1024)
  })

  it('expone el máximo en MB para mensajes de feedback', () => {
    expect(MAX_WALLPAPER_MB).toBe(Math.round(MAX_WALLPAPER_BYTES / (1024 * 1024)))
  })
})

describe('validateImageFile', () => {
  it('acepta una imagen dentro del límite', () => {
    expect(validateImageFile(fileOfSize(1024))).toEqual({ ok: true })
  })

  it('rechaza un archivo que no es imagen', () => {
    expect(validateImageFile(fileOfSize(10, 'application/pdf', 'cv.pdf'))).toEqual({
      ok: false,
      reason: 'type',
    })
    expect(validateImageFile(fileOfSize(10, '', 'sin-tipo'))).toEqual({ ok: false, reason: 'type' })
  })

  it('rechaza una imagen demasiado grande', () => {
    expect(validateImageFile(fileOfSize(MAX_WALLPAPER_BYTES + 1))).toEqual({
      ok: false,
      reason: 'size',
    })
  })

  it('acepta una imagen justo en el límite', () => {
    expect(validateImageFile(fileOfSize(MAX_WALLPAPER_BYTES))).toEqual({ ok: true })
  })
})

describe('fileToDataUrl', () => {
  class MockFileReader {
    result: string | ArrayBuffer | null = null
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    readAsDataURL(file: File) {
      if (file.name === 'roto.png') {
        this.onerror?.()
        return
      }
      this.result = 'data:image/png;base64,QUJD'
      this.onload?.()
    }
  }

  beforeEach(() => {
    vi.stubGlobal('FileReader', MockFileReader)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('resuelve con la data URL cuando la lectura funciona', async () => {
    await expect(fileToDataUrl(fileOfSize(10))).resolves.toBe('data:image/png;base64,QUJD')
  })

  it('rechaza cuando la lectura falla', async () => {
    await expect(
      fileToDataUrl(new File([new Uint8Array(1)], 'roto.png', { type: 'image/png' }))
    ).rejects.toThrow()
  })
})
