import { describe, it, expect, beforeEach } from 'vitest'
import {
  themes,
  DEFAULT_THEME,
  applyTheme,
  getThemeById,
  ACCENT_NAMES,
  type AccentName,
} from './themes'

describe('themes', () => {
  describe('themes array', () => {
    it('tiene exactamente 2 temas', () => {
      expect(themes).toHaveLength(2)
    })

    it('cada tema tiene id, name, colors y fonts', () => {
      for (const theme of themes) {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('colors')
        expect(theme).toHaveProperty('fonts')
      }
    })

    it('incluye el tema dark', () => {
      expect(themes.some((t) => t.id === 'dark')).toBe(true)
    })

    it('incluye el tema light', () => {
      expect(themes.some((t) => t.id === 'light')).toBe(true)
    })

    it('cada tema tiene isDark como boolean', () => {
      for (const theme of themes) {
        expect(theme).toHaveProperty('isDark')
        expect(typeof theme.isDark).toBe('boolean')
      }
    })

    it('dark es isDark true, light es isDark false', () => {
      expect(getThemeById('dark')!.isDark).toBe(true)
      expect(getThemeById('light')!.isDark).toBe(false)
    })
  })

  describe('ThemeColors', () => {
    const requiredColors = [
      'canvas',
      'surface1',
      'surface2',
      'surface3',
      'surface4',
      'hairline',
      'hairlineStrong',
      'hairlineTertiary',
      'ink',
      'inkMuted',
      'inkSubtle',
      'inkTertiary',
      'primary',
      'primaryHover',
      'primaryFocus',
      'onPrimary',
      'brandSecure',
      'success',
      'overlay',
    ] as const

    it('cada tema tiene los 19 colores requeridos', () => {
      for (const theme of themes) {
        for (const color of requiredColors) {
          expect(theme.colors).toHaveProperty(color)
          expect(typeof theme.colors[color]).toBe('string')
          expect(theme.colors[color].length).toBeGreaterThan(0)
        }
      }
    })

    it('los valores de colores son formato RGB (3 numeros separados por espacios)', () => {
      const rgbPattern = /^\d{1,3}\s\d{1,3}\s\d{1,3}$/
      for (const theme of themes) {
        for (const color of requiredColors) {
          expect(theme.colors[color]).toMatch(rgbPattern)
        }
      }
    })
  })

  describe('paleta cálida (Oscuro y Claro)', () => {
    it('Oscuro es warm-dark: canvas casi negro con tinte marrón/oliva', () => {
      const dark = getThemeById('dark')!.colors
      const [r, g, b] = dark.canvas.split(' ').map(Number)
      expect(r).toBeLessThanOrEqual(20)
      expect(r).toBeGreaterThanOrEqual(g)
      expect(b).toBeLessThan(g)
    })

    it('Oscuro usa la ladder de surfaces cálidas ascendente', () => {
      const c = getThemeById('dark')!.colors
      const luma = (s: string) =>
        s
          .split(' ')
          .slice(0, 3)
          .reduce((a, v) => a + Number(v), 0)
      expect(luma(c.canvas)).toBeLessThan(luma(c.surface1))
      expect(luma(c.surface1)).toBeLessThan(luma(c.surface2))
      expect(luma(c.surface2)).toBeLessThan(luma(c.surface3))
      expect(luma(c.surface3)).toBeLessThan(luma(c.surface4))
    })

    it('Claro es crema cálido (no blanco duro ni frío)', () => {
      const light = getThemeById('light')!.colors
      const [r, g, b] = light.canvas.split(' ').map(Number)
      expect(r).toBeGreaterThan(g)
      expect(g).toBeGreaterThan(b)
      const luma = r + g + b
      expect(luma).toBeLessThanOrEqual(710)
    })

    it('Claro: surface-3 y surface-4 se distinguen del canvas (celdas del calendario visibles)', () => {
      const c = getThemeById('light')!.colors
      const luma = (s: string) =>
        s
          .split(' ')
          .slice(0, 3)
          .reduce((a, v) => a + Number(v), 0)
      expect(luma(c.surface3)).toBeLessThanOrEqual(660)
      expect(luma(c.surface4)).toBeLessThanOrEqual(620)
    })

    it('el primario es violeta estilo Attio (#6E56CF ≈ 110 86 207)', () => {
      const [r, g, b] = getThemeById('dark')!.colors.primary.split(' ').map(Number)
      expect(Math.abs(r - 110)).toBeLessThanOrEqual(6)
      expect(Math.abs(g - 86)).toBeLessThanOrEqual(6)
      expect(Math.abs(b - 207)).toBeLessThanOrEqual(6)
    })

    it('primaryHover y primaryFocus derivan del primario (no lo repiten)', () => {
      for (const id of ['dark', 'light']) {
        const c = getThemeById(id)!.colors
        expect(c.primaryHover).not.toBe(c.primary)
        expect(c.primaryFocus).not.toBe(c.primary)
      }
    })

    it('las hairlines cálidas acompañan al canvas (r >= b en Oscuro)', () => {
      const c = getThemeById('dark')!.colors
      const warm = (s: string) => {
        const [r, , b] = s.split(' ').map(Number)
        return r >= b
      }
      expect(warm(c.hairline)).toBe(true)
      expect(warm(c.hairlineStrong)).toBe(true)
      expect(warm(c.hairlineTertiary)).toBe(true)
    })
  })

  describe('accents (escala de acentos semánticos)', () => {
    const required: readonly AccentName[] = ['green', 'orange', 'red', 'purple']

    it('ACCENT_NAMES expone green, orange, red y purple', () => {
      expect(ACCENT_NAMES).toEqual(required)
    })

    it('cada tema define cada acento con variantes solid y tint (formato RGB)', () => {
      const rgbPattern = /^\d{1,3}\s\d{1,3}\s\d{1,3}$/
      for (const theme of themes) {
        for (const name of required) {
          expect(theme.accents).toHaveProperty(name)
          expect(theme.accents[name].solid).toMatch(rgbPattern)
          expect(theme.accents[name].tint).toMatch(rgbPattern)
          expect(theme.accents[name].solid).not.toBe(theme.accents[name].tint)
        }
      }
    })
  })

  describe('ThemeBlockColors', () => {
    const requiredBlockColors = [
      'lavender',
      'green',
      'yellow',
      'red',
      'pink',
      'cyan',
      'orange',
      'bone',
    ] as const

    it('cada tema tiene los 8 colores de bloque requeridos', () => {
      for (const theme of themes) {
        for (const color of requiredBlockColors) {
          expect(theme.blockColors).toHaveProperty(color)
          expect(typeof theme.blockColors[color]).toBe('string')
          expect(theme.blockColors[color].length).toBeGreaterThan(0)
        }
      }
    })

    it('los valores son formato RGB (3 numeros separados por espacios)', () => {
      const rgbPattern = /^\d{1,3}\s\d{1,3}\s\d{1,3}$/
      for (const theme of themes) {
        for (const color of requiredBlockColors) {
          expect(theme.blockColors[color]).toMatch(rgbPattern)
        }
      }
    })

    it('lavender coincide con el palette de bloque del resto de temas (identidad estable)', () => {
      const lavenderDark = themes.find((t) => t.id === 'dark')!.blockColors.lavender
      for (const theme of themes) {
        expect(theme.blockColors.lavender).toBe(lavenderDark)
      }
    })

    it('los bloques están re-tuneados a la familia cálida', () => {
      const blocks = getThemeById('dark')!.blockColors
      expect(blocks.lavender).toBe('110 86 207')
      expect(blocks.cyan).toBe('94 174 176')
      expect(blocks.bone).toBe('214 209 197')
    })

    it('lavender del bloque coincide con el primario violeta Attio', () => {
      for (const id of ['dark', 'light']) {
        expect(getThemeById(id)!.blockColors.lavender).toBe(getThemeById(id)!.colors.primary)
      }
    })
  })

  describe('ThemeFonts', () => {
    it('cada tema tiene fonts.sans como array de strings', () => {
      for (const theme of themes) {
        expect(Array.isArray(theme.fonts.sans)).toBe(true)
        expect(theme.fonts.sans.length).toBeGreaterThan(0)
        for (const font of theme.fonts.sans) {
          expect(typeof font).toBe('string')
        }
      }
    })

    it('cada tema tiene fonts.mono como array de strings', () => {
      for (const theme of themes) {
        expect(Array.isArray(theme.fonts.mono)).toBe(true)
        expect(theme.fonts.mono.length).toBeGreaterThan(0)
        for (const font of theme.fonts.mono) {
          expect(typeof font).toBe('string')
        }
      }
    })
  })

  describe('DEFAULT_THEME', () => {
    it('es el tema dark', () => {
      expect(DEFAULT_THEME.id).toBe('dark')
    })

    it('esta incluido en el array themes', () => {
      expect(themes).toContain(DEFAULT_THEME)
    })
  })

  describe('getThemeById', () => {
    it('retorna el tema dark cuando busco "dark"', () => {
      const theme = getThemeById('dark')
      expect(theme).toBeDefined()
      expect(theme!.id).toBe('dark')
    })

    it('retorna el tema light cuando busco "light"', () => {
      const theme = getThemeById('light')
      expect(theme).toBeDefined()
      expect(theme!.id).toBe('light')
    })

    it('retorna undefined para un id inexistente', () => {
      expect(getThemeById('inexistente')).toBeUndefined()
      expect(getThemeById('popi')).toBeUndefined()
    })
  })

  describe('applyTheme', () => {
    let root: HTMLElement

    beforeEach(() => {
      root = document.documentElement
      root.removeAttribute('style')
      root.classList.remove('dark')
    })

    it('setea las CSS vars de colores en documentElement', () => {
      const theme = getThemeById('dark')!
      applyTheme(theme)

      expect(root.style.getPropertyValue('--color-canvas')).toBe(theme.colors.canvas)
      expect(root.style.getPropertyValue('--color-surface-1')).toBe(theme.colors.surface1)
      expect(root.style.getPropertyValue('--color-surface-2')).toBe(theme.colors.surface2)
      expect(root.style.getPropertyValue('--color-surface-3')).toBe(theme.colors.surface3)
      expect(root.style.getPropertyValue('--color-surface-4')).toBe(theme.colors.surface4)
      expect(root.style.getPropertyValue('--color-hairline')).toBe(theme.colors.hairline)
      expect(root.style.getPropertyValue('--color-hairline-strong')).toBe(
        theme.colors.hairlineStrong
      )
      expect(root.style.getPropertyValue('--color-hairline-tertiary')).toBe(
        theme.colors.hairlineTertiary
      )
      expect(root.style.getPropertyValue('--color-ink')).toBe(theme.colors.ink)
      expect(root.style.getPropertyValue('--color-ink-muted')).toBe(theme.colors.inkMuted)
      expect(root.style.getPropertyValue('--color-ink-subtle')).toBe(theme.colors.inkSubtle)
      expect(root.style.getPropertyValue('--color-ink-tertiary')).toBe(theme.colors.inkTertiary)
      expect(root.style.getPropertyValue('--color-primary')).toBe(theme.colors.primary)
      expect(root.style.getPropertyValue('--color-primary-hover')).toBe(theme.colors.primaryHover)
      expect(root.style.getPropertyValue('--color-primary-focus')).toBe(theme.colors.primaryFocus)
      expect(root.style.getPropertyValue('--color-on-primary')).toBe(theme.colors.onPrimary)
      expect(root.style.getPropertyValue('--color-brand-secure')).toBe(theme.colors.brandSecure)
      expect(root.style.getPropertyValue('--color-success')).toBe(theme.colors.success)
      expect(root.style.getPropertyValue('--color-overlay')).toBe(theme.colors.overlay)
      expect(root.style.getPropertyValue('--color-block-lavender')).toBe(theme.blockColors.lavender)
      expect(root.style.getPropertyValue('--color-block-cyan')).toBe(theme.blockColors.cyan)
    })

    it('setea las CSS vars de los acentos semánticos (solid + tinted)', () => {
      const theme = getThemeById('dark')!
      applyTheme(theme)

      for (const name of ['green', 'orange', 'red', 'purple'] as const) {
        expect(root.style.getPropertyValue(`--color-accent-${name}`)).toBe(
          theme.accents[name].solid
        )
        expect(root.style.getPropertyValue(`--color-accent-${name}-tint`)).toBe(
          theme.accents[name].tint
        )
      }
    })

    it('setea las CSS vars de fuentes en documentElement', () => {
      const theme = getThemeById('dark')!
      applyTheme(theme)

      expect(root.style.getPropertyValue('--font-sans')).toBe(theme.fonts.sans.join(', '))
      expect(root.style.getPropertyValue('--font-mono')).toBe(theme.fonts.mono.join(', '))
    })

    it('agrega clase "dark" cuando el tema es dark', () => {
      applyTheme(getThemeById('dark')!)
      expect(root.classList.contains('dark')).toBe(true)
    })

    it('remueve clase "dark" cuando el tema es light', () => {
      root.classList.add('dark')
      applyTheme(getThemeById('light')!)
      expect(root.classList.contains('dark')).toBe(false)
    })
  })
})
