import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import * as db from '@/lib/db'
import { useUiStore } from './ui'
import { defaultWallpaperSettings } from '@/schemas/wallpaper'

vi.mock('@/lib/db', () => ({
  loadConfig: vi.fn().mockResolvedValue(null),
  saveConfig: vi.fn().mockResolvedValue(undefined),
}))

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

describe('ui store: wallpaper', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(db.loadConfig).mockResolvedValue(null)
    vi.mocked(db.saveConfig).mockResolvedValue(undefined)
  })

  it('arranca con wallpaperUrl null', () => {
    const ui = useUiStore()
    expect(ui.wallpaperUrl).toBeNull()
  })

  it('loadWallpaper restaura la data URL persistida', async () => {
    vi.mocked(db.loadConfig).mockResolvedValue(JSON.stringify({ dataUrl: PNG_DATA_URL }))
    const ui = useUiStore()
    await ui.loadWallpaper()
    expect(ui.wallpaperUrl).toBe(PNG_DATA_URL)
  })

  it('loadWallpaper cae a null con config corrupta, sin lanzar', async () => {
    vi.mocked(db.loadConfig).mockResolvedValue('{roto')
    const ui = useUiStore()
    await expect(ui.loadWallpaper()).resolves.not.toThrow()
    expect(ui.wallpaperUrl).toBeNull()
  })

  it('loadWallpaper cae a null con config que no es imagen', async () => {
    vi.mocked(db.loadConfig).mockResolvedValue(
      JSON.stringify({ dataUrl: 'data:text/html;base64,PGgxPg==' })
    )
    const ui = useUiStore()
    await ui.loadWallpaper()
    expect(ui.wallpaperUrl).toBeNull()
  })

  it('setWallpaper persiste el JSON en el KV y actualiza el estado', async () => {
    const ui = useUiStore()
    await ui.setWallpaper(PNG_DATA_URL)
    expect(db.saveConfig).toHaveBeenCalledWith(
      'wallpaper-settings',
      JSON.stringify({ dataUrl: PNG_DATA_URL })
    )
    expect(ui.wallpaperUrl).toBe(PNG_DATA_URL)
  })

  it('removeWallpaper persiste null y limpia el estado', async () => {
    const ui = useUiStore()
    await ui.setWallpaper(PNG_DATA_URL)
    vi.mocked(db.saveConfig).mockClear()
    await ui.removeWallpaper()
    expect(db.saveConfig).toHaveBeenCalledWith(
      'wallpaper-settings',
      JSON.stringify(defaultWallpaperSettings)
    )
    expect(ui.wallpaperUrl).toBeNull()
  })

  it('setWallpaper rechaza una data URL no imagen y no persiste', async () => {
    const ui = useUiStore()
    await expect(ui.setWallpaper('https://ejemplo.com/foto.png')).rejects.toThrow()
    expect(db.saveConfig).not.toHaveBeenCalled()
    expect(ui.wallpaperUrl).toBeNull()
  })
})
