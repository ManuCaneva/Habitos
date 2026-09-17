import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import WallpaperLayer from './WallpaperLayer.vue'
import { hasRawPaletteColor } from '@/test/colorGuard'

const PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

describe('WallpaperLayer', () => {
  it('con wallpaper: la imagen usa background con blur y scrim de canvas', () => {
    const w = mount(WallpaperLayer, { props: { url: PNG_DATA_URL } })
    expect(w.find("[data-testid='wallpaper-layer']").exists()).toBe(true)
    const image = w.find("[data-testid='wallpaper-image']")
    expect(image.exists()).toBe(true)
    const style = (image.element as HTMLElement).style
    expect(style.backgroundImage).toContain(PNG_DATA_URL)
    // blur pre-aplicado en la capa de fondo (clase del sistema, no inline)
    expect(image.classes()).toContain('wallpaper-image-blur')
    // scrim de canvas con alpha para contraste
    const scrim = w.find("[data-testid='wallpaper-layer'] > div:last-child")
    expect(scrim.classes()).toContain('wallpaper-scrim')
  })

  it('sin wallpaper: no renderiza la capa de imagen', () => {
    const w = mount(WallpaperLayer, { props: { url: null } })
    expect(w.find("[data-testid='wallpaper-image']").exists()).toBe(false)
  })

  it('sin wallpaper: renderiza el gradiente de fábrica construido con tokens', () => {
    const w = mount(WallpaperLayer, { props: { url: null } })
    const fallback = w.find("[data-testid='wallpaper-fallback']")
    expect(fallback.exists()).toBe(true)
    // el gradiente sale de tokens CSS vars, no de hex crudos
    expect(fallback.classes()).toContain('wallpaper-fallback')
  })

  it('reactivo: al pasar de null a url muestra la imagen y oculta el fallback', async () => {
    const w = mount(WallpaperLayer, { props: { url: null } })
    expect(w.find("[data-testid='wallpaper-fallback']").exists()).toBe(true)
    await w.setProps({ url: PNG_DATA_URL })
    expect(w.find("[data-testid='wallpaper-image']").exists()).toBe(true)
    expect(w.find("[data-testid='wallpaper-fallback']").exists()).toBe(false)
  })

  it('la capa es aria-hidden (decorativa)', () => {
    const w = mount(WallpaperLayer, { props: { url: null } })
    expect(w.find("[data-testid='wallpaper-layer']").attributes('aria-hidden')).toBe('true')
  })

  it('no usa colores de paleta crudos de Tailwind', () => {
    const w = mount(WallpaperLayer, { props: { url: null } })
    expect(hasRawPaletteColor(w.html())).toBe(false)
  })
})
