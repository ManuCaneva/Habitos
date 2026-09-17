export interface ThemeColors {
  canvas: string
  surface1: string
  surface2: string
  surface3: string
  surface4: string
  hairline: string
  hairlineStrong: string
  hairlineTertiary: string
  ink: string
  inkMuted: string
  inkSubtle: string
  inkTertiary: string
  primary: string
  primaryHover: string
  primaryFocus: string
  onPrimary: string
  brandSecure: string
  success: string
  overlay: string
}

export interface ThemeBlockColors {
  lavender: string
  green: string
  yellow: string
  red: string
  pink: string
  cyan: string
  orange: string
  bone: string
}

export interface ThemeFonts {
  sans: string[]
  mono: string[]
}

export interface AccentColor {
  solid: string
  tint: string
}

export type AccentName = 'green' | 'orange' | 'red' | 'purple'
export type AccentScale = Record<AccentName, AccentColor>

export interface ThemeDefinition {
  id: string
  name: string
  isDark: boolean
  colors: ThemeColors
  blockColors: ThemeBlockColors
  accents: AccentScale
  fonts: ThemeFonts
}

const sharedBlockColors: ThemeBlockColors = {
  lavender: '110 86 207',
  green: '82 184 122',
  yellow: '233 196 90',
  red: '229 94 84',
  pink: '230 130 175',
  cyan: '94 174 176',
  orange: '236 150 74',
  bone: '214 209 197',
}

const darkAccents: AccentScale = {
  green: { solid: '82 184 122', tint: '28 51 39' },
  orange: { solid: '236 150 74', tint: '56 39 24' },
  red: { solid: '229 94 84', tint: '57 33 31' },
  purple: { solid: '110 86 207', tint: '40 34 69' },
}

const lightAccents: AccentScale = {
  green: { solid: '31 138 76', tint: '222 242 229' },
  orange: { solid: '193 106 26', tint: '250 235 216' },
  red: { solid: '199 60 51', tint: '251 228 226' },
  purple: { solid: '110 86 207', tint: '235 231 250' },
}

export const ACCENT_NAMES: readonly AccentName[] = ['green', 'orange', 'red', 'purple']

const sharedFonts: ThemeFonts = {
  sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
}

export const themes: readonly ThemeDefinition[] = [
  {
    id: 'dark',
    name: 'Oscuro',
    isDark: true,
    colors: {
      canvas: '12 11 10',
      surface1: '22 20 18',
      surface2: '32 29 26',
      surface3: '44 40 36',
      surface4: '58 53 47',
      hairline: '46 42 37',
      hairlineStrong: '66 60 53',
      hairlineTertiary: '88 80 71',
      ink: '244 241 236',
      inkMuted: '206 199 189',
      inkSubtle: '150 142 131',
      inkTertiary: '108 101 92',
      primary: '110 86 207',
      primaryHover: '128 106 224',
      primaryFocus: '96 74 189',
      onPrimary: '250 248 245',
      brandSecure: '146 132 191',
      success: '82 184 122',
      overlay: '20 16 12',
    },
    blockColors: sharedBlockColors,
    accents: darkAccents,
    fonts: sharedFonts,
  },
  {
    id: 'light',
    name: 'Claro',
    isDark: false,
    colors: {
      canvas: '243 238 226',
      surface1: '249 245 236',
      surface2: '237 231 218',
      surface3: '226 219 204',
      surface4: '214 206 191',
      hairline: '224 217 203',
      hairlineStrong: '199 190 174',
      hairlineTertiary: '168 158 141',
      ink: '28 26 23',
      inkMuted: '64 59 53',
      inkSubtle: '112 105 95',
      inkTertiary: '148 140 128',
      primary: '110 86 207',
      primaryHover: '92 70 184',
      primaryFocus: '102 80 192',
      onPrimary: '255 255 255',
      brandSecure: '110 98 158',
      success: '31 138 76',
      overlay: '24 18 12',
    },
    blockColors: sharedBlockColors,
    accents: lightAccents,
    fonts: sharedFonts,
  },
] as const

export const DEFAULT_THEME: ThemeDefinition = themes[0]

export function getThemeById(id: string): ThemeDefinition | undefined {
  return themes.find((t) => t.id === id)
}

export function applyTheme(theme: ThemeDefinition): void {
  const root = document.documentElement
  const c = theme.colors
  const b = theme.blockColors

  root.style.setProperty('--color-canvas', c.canvas)
  root.style.setProperty('--color-surface-1', c.surface1)
  root.style.setProperty('--color-surface-2', c.surface2)
  root.style.setProperty('--color-surface-3', c.surface3)
  root.style.setProperty('--color-surface-4', c.surface4)
  root.style.setProperty('--color-hairline', c.hairline)
  root.style.setProperty('--color-hairline-strong', c.hairlineStrong)
  root.style.setProperty('--color-hairline-tertiary', c.hairlineTertiary)
  root.style.setProperty('--color-ink', c.ink)
  root.style.setProperty('--color-ink-muted', c.inkMuted)
  root.style.setProperty('--color-ink-subtle', c.inkSubtle)
  root.style.setProperty('--color-ink-tertiary', c.inkTertiary)
  root.style.setProperty('--color-primary', c.primary)
  root.style.setProperty('--color-primary-hover', c.primaryHover)
  root.style.setProperty('--color-primary-focus', c.primaryFocus)
  root.style.setProperty('--color-on-primary', c.onPrimary)
  root.style.setProperty('--color-brand-secure', c.brandSecure)
  root.style.setProperty('--color-success', c.success)
  root.style.setProperty('--color-overlay', c.overlay)

  for (const [name, value] of Object.entries(b)) {
    root.style.setProperty(`--color-block-${name}`, value)
  }

  for (const name of ACCENT_NAMES) {
    const accent = theme.accents[name]
    root.style.setProperty(`--color-accent-${name}`, accent.solid)
    root.style.setProperty(`--color-accent-${name}-tint`, accent.tint)
  }

  root.style.setProperty('--font-sans', theme.fonts.sans.join(', '))
  root.style.setProperty('--font-mono', theme.fonts.mono.join(', '))

  root.classList.toggle('dark', theme.isDark)
}
