export interface ThemeColors {
  canvas: string;
  surface1: string;
  surface2: string;
  surface3: string;
  surface4: string;
  hairline: string;
  hairlineStrong: string;
  hairlineTertiary: string;
  ink: string;
  inkMuted: string;
  inkSubtle: string;
  inkTertiary: string;
  primary: string;
  primaryHover: string;
  primaryFocus: string;
  brandSecure: string;
  success: string;
  overlay: string;
}

export interface ThemeFonts {
  sans: string[];
  mono: string[];
}

export interface ThemeDefinition {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: ThemeFonts;
}

const sharedFonts: ThemeFonts = {
  sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
  mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
};

export const themes: readonly ThemeDefinition[] = [
  {
    id: "dark",
    name: "Oscuro",
    colors: {
      canvas: "1 1 2",
      surface1: "14 15 18",
      surface2: "24 25 30",
      surface3: "34 35 42",
      surface4: "44 45 53",
      hairline: "35 37 42",
      hairlineStrong: "57 59 66",
      hairlineTertiary: "74 77 86",
      ink: "247 248 248",
      inkMuted: "208 214 224",
      inkSubtle: "138 143 152",
      inkTertiary: "98 102 109",
      primary: "94 106 210",
      primaryHover: "130 143 255",
      primaryFocus: "94 105 209",
      brandSecure: "122 127 173",
      success: "39 166 68",
      overlay: "0 0 0",
    },
    fonts: sharedFonts,
  },
  {
    id: "light",
    name: "Claro",
    colors: {
      canvas: "255 255 255",
      surface1: "247 248 248",
      surface2: "238 240 242",
      surface3: "228 230 233",
      surface4: "216 218 223",
      hairline: "228 230 233",
      hairlineStrong: "197 200 206",
      hairlineTertiary: "168 172 180",
      ink: "14 15 18",
      inkMuted: "44 45 53",
      inkSubtle: "98 102 109",
      inkTertiary: "138 143 152",
      primary: "94 106 210",
      primaryHover: "77 89 192",
      primaryFocus: "94 105 209",
      brandSecure: "122 127 173",
      success: "29 138 54",
      overlay: "0 0 0",
    },
    fonts: sharedFonts,
  },
] as const;

export const DEFAULT_THEME: ThemeDefinition = themes[0];

export function getThemeById(id: string): ThemeDefinition | undefined {
  return themes.find((t) => t.id === id);
}

export function applyTheme(theme: ThemeDefinition): void {
  const root = document.documentElement;
  const c = theme.colors;

  root.style.setProperty("--color-canvas", c.canvas);
  root.style.setProperty("--color-surface-1", c.surface1);
  root.style.setProperty("--color-surface-2", c.surface2);
  root.style.setProperty("--color-surface-3", c.surface3);
  root.style.setProperty("--color-surface-4", c.surface4);
  root.style.setProperty("--color-hairline", c.hairline);
  root.style.setProperty("--color-hairline-strong", c.hairlineStrong);
  root.style.setProperty("--color-hairline-tertiary", c.hairlineTertiary);
  root.style.setProperty("--color-ink", c.ink);
  root.style.setProperty("--color-ink-muted", c.inkMuted);
  root.style.setProperty("--color-ink-subtle", c.inkSubtle);
  root.style.setProperty("--color-ink-tertiary", c.inkTertiary);
  root.style.setProperty("--color-primary", c.primary);
  root.style.setProperty("--color-primary-hover", c.primaryHover);
  root.style.setProperty("--color-primary-focus", c.primaryFocus);
  root.style.setProperty("--color-brand-secure", c.brandSecure);
  root.style.setProperty("--color-success", c.success);
  root.style.setProperty("--color-overlay", c.overlay);

  root.style.setProperty("--font-sans", theme.fonts.sans.join(", "));
  root.style.setProperty("--font-mono", theme.fonts.mono.join(", "));

  root.classList.toggle("dark", theme.id === "dark");
}
