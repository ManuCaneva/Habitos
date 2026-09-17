import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WallpaperCard from './WallpaperCard.vue'
import { hasRawPaletteColor } from '@/test/colorGuard'
import { MAX_WALLPAPER_BYTES } from '@/lib/wallpaper'

vi.mock('@/lib/wallpaper', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/wallpaper')>()
  return {
    ...actual,
    fileToDataUrl: vi.fn(),
  }
})

import { fileToDataUrl } from '@/lib/wallpaper'

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const uiMock = {
  wallpaperUrl: null as string | null,
  setWallpaper: vi.fn().mockResolvedValue(undefined),
  removeWallpaper: vi.fn().mockResolvedValue(undefined),
}

vi.mock('@/stores/ui', () => ({
  useUiStore: () => uiMock,
}))

function pngFile(sizeBytes = 10, name = 'fondo.png'): File {
  return new File([new Uint8Array(sizeBytes)], name, { type: 'image/png' })
}

function changeWith(w: ReturnType<typeof mount>, file: File | null) {
  const input = w.find("[data-testid='wallpaper-input']").element as HTMLInputElement
  if (file) {
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
  } else {
    Object.defineProperty(input, 'files', { value: null, configurable: true })
  }
  return w.find("[data-testid='wallpaper-input']").trigger('change')
}

describe('WallpaperCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fileToDataUrl).mockResolvedValue(PNG_DATA_URL)
    uiMock.wallpaperUrl = null
    uiMock.setWallpaper.mockClear().mockResolvedValue(undefined)
    uiMock.removeWallpaper.mockClear().mockResolvedValue(undefined)
  })

  it('muestra botón subir y no muestra quitar sin wallpaper', () => {
    const w = mount(WallpaperCard)
    expect(w.find("[data-testid='wallpaper-upload-btn']").exists()).toBe(true)
    expect(w.find("[data-testid='wallpaper-remove-btn']").exists()).toBe(false)
    expect(w.find("[data-testid='wallpaper-preview']").exists()).toBe(false)
  })

  it('input file oculto acepta solo imágenes', () => {
    const w = mount(WallpaperCard)
    const input = w.find("[data-testid='wallpaper-input']")
    expect(input.attributes('type')).toBe('file')
    expect(input.attributes('accept')).toBe('image/*')
    expect(input.classes()).toContain('hidden')
  })

  it('subir un archivo válido llama setWallpaper con la data URL', async () => {
    const w = mount(WallpaperCard)
    await changeWith(w, pngFile())
    await w.vm.$nextTick()
    expect(uiMock.setWallpaper).toHaveBeenCalledWith(PNG_DATA_URL)
  })

  it('con wallpaper: muestra preview y botón quitar; quitar llama removeWallpaper', async () => {
    uiMock.wallpaperUrl = PNG_DATA_URL
    const w = mount(WallpaperCard)
    const preview = w.find("[data-testid='wallpaper-preview']")
    expect(preview.exists()).toBe(true)
    expect((preview.element as HTMLElement).style.backgroundImage).toContain(PNG_DATA_URL)
    // el preview lleva el mismo tratamiento blur+scrim que la capa de fondo
    expect(preview.classes()).toContain('wallpaper-image-blur')
    expect(preview.find('.wallpaper-scrim').exists()).toBe(true)
    expect(w.find("[data-testid='wallpaper-remove-btn']").exists()).toBe(true)
    await w.find("[data-testid='wallpaper-remove-btn']").trigger('click')
    expect(uiMock.removeWallpaper).toHaveBeenCalled()
  })

  it('archivo no imagen: feedback visible y no persiste', async () => {
    const w = mount(WallpaperCard)
    await changeWith(w, new File([new Uint8Array(5)], 'cv.pdf', { type: 'application/pdf' }))
    await w.vm.$nextTick()
    expect(w.text()).toContain('imagen')
    expect(uiMock.setWallpaper).not.toHaveBeenCalled()
  })

  it('archivo demasiado grande: feedback visible y no persiste', async () => {
    const w = mount(WallpaperCard)
    await changeWith(w, pngFile(MAX_WALLPAPER_BYTES + 1))
    await w.vm.$nextTick()
    expect(w.text()).toContain('MB')
    expect(uiMock.setWallpaper).not.toHaveBeenCalled()
  })

  it('change sin archivo no hace nada', async () => {
    const w = mount(WallpaperCard)
    await changeWith(w, null)
    expect(uiMock.setWallpaper).not.toHaveBeenCalled()
  })

  it('fallo de persistencia: feedback de guardado, no de lectura', async () => {
    const w = mount(WallpaperCard)
    uiMock.setWallpaper.mockRejectedValueOnce(new Error('db down'))
    await changeWith(w, pngFile())
    await w.vm.$nextTick()
    expect(w.text()).toContain('guardar')
    expect(w.text()).not.toContain('leer')
  })

  it('no usa colores de paleta crudos de Tailwind', () => {
    const w = mount(WallpaperCard)
    expect(hasRawPaletteColor(w.html())).toBe(false)
  })
})
