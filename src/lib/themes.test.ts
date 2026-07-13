import { describe, it, expect, beforeEach } from "vitest";
import {
  themes,
  DEFAULT_THEME,
  applyTheme,
  getThemeById,
} from "./themes";

describe("themes", () => {
  describe("themes array", () => {
    it("tiene exactamente 2 temas", () => {
      expect(themes).toHaveLength(2);
    });

    it("cada tema tiene id, name, colors y fonts", () => {
      for (const theme of themes) {
        expect(theme).toHaveProperty("id");
        expect(theme).toHaveProperty("name");
        expect(theme).toHaveProperty("colors");
        expect(theme).toHaveProperty("fonts");
      }
    });

    it("incluye el tema dark", () => {
      expect(themes.some((t) => t.id === "dark")).toBe(true);
    });

    it("incluye el tema light", () => {
      expect(themes.some((t) => t.id === "light")).toBe(true);
    });
  });

  describe("ThemeColors", () => {
    const requiredColors = [
      "canvas",
      "surface1",
      "surface2",
      "surface3",
      "surface4",
      "hairline",
      "hairlineStrong",
      "hairlineTertiary",
      "ink",
      "inkMuted",
      "inkSubtle",
      "inkTertiary",
      "primary",
      "primaryHover",
      "primaryFocus",
      "brandSecure",
      "success",
      "overlay",
    ] as const;

    it("cada tema tiene los 18 colores requeridos", () => {
      for (const theme of themes) {
        for (const color of requiredColors) {
          expect(theme.colors).toHaveProperty(color);
          expect(typeof theme.colors[color]).toBe("string");
          expect(theme.colors[color].length).toBeGreaterThan(0);
        }
      }
    });

    it("los valores de colores son formato RGB (3 numeros separados por espacios)", () => {
      const rgbPattern = /^\d{1,3}\s\d{1,3}\s\d{1,3}$/;
      for (const theme of themes) {
        for (const color of requiredColors) {
          expect(theme.colors[color]).toMatch(rgbPattern);
        }
      }
    });
  });

  describe("ThemeFonts", () => {
    it("cada tema tiene fonts.sans como array de strings", () => {
      for (const theme of themes) {
        expect(Array.isArray(theme.fonts.sans)).toBe(true);
        expect(theme.fonts.sans.length).toBeGreaterThan(0);
        for (const font of theme.fonts.sans) {
          expect(typeof font).toBe("string");
        }
      }
    });

    it("cada tema tiene fonts.mono como array de strings", () => {
      for (const theme of themes) {
        expect(Array.isArray(theme.fonts.mono)).toBe(true);
        expect(theme.fonts.mono.length).toBeGreaterThan(0);
        for (const font of theme.fonts.mono) {
          expect(typeof font).toBe("string");
        }
      }
    });
  });

  describe("DEFAULT_THEME", () => {
    it("es el tema dark", () => {
      expect(DEFAULT_THEME.id).toBe("dark");
    });

    it("esta incluido en el array themes", () => {
      expect(themes).toContain(DEFAULT_THEME);
    });
  });

  describe("getThemeById", () => {
    it('retorna el tema dark cuando busco "dark"', () => {
      const theme = getThemeById("dark");
      expect(theme).toBeDefined();
      expect(theme!.id).toBe("dark");
    });

    it('retorna el tema light cuando busco "light"', () => {
      const theme = getThemeById("light");
      expect(theme).toBeDefined();
      expect(theme!.id).toBe("light");
    });

    it("retorna undefined para un id inexistente", () => {
      expect(getThemeById("inexistente")).toBeUndefined();
    });
  });

  describe("applyTheme", () => {
    let root: HTMLElement;

    beforeEach(() => {
      root = document.documentElement;
      root.removeAttribute("style");
      root.classList.remove("dark");
    });

    it("setea las CSS vars de colores en documentElement", () => {
      const theme = getThemeById("dark")!;
      applyTheme(theme);

      expect(root.style.getPropertyValue("--color-canvas")).toBe(theme.colors.canvas);
      expect(root.style.getPropertyValue("--color-surface-1")).toBe(theme.colors.surface1);
      expect(root.style.getPropertyValue("--color-surface-2")).toBe(theme.colors.surface2);
      expect(root.style.getPropertyValue("--color-surface-3")).toBe(theme.colors.surface3);
      expect(root.style.getPropertyValue("--color-surface-4")).toBe(theme.colors.surface4);
      expect(root.style.getPropertyValue("--color-hairline")).toBe(theme.colors.hairline);
      expect(root.style.getPropertyValue("--color-hairline-strong")).toBe(theme.colors.hairlineStrong);
      expect(root.style.getPropertyValue("--color-hairline-tertiary")).toBe(theme.colors.hairlineTertiary);
      expect(root.style.getPropertyValue("--color-ink")).toBe(theme.colors.ink);
      expect(root.style.getPropertyValue("--color-ink-muted")).toBe(theme.colors.inkMuted);
      expect(root.style.getPropertyValue("--color-ink-subtle")).toBe(theme.colors.inkSubtle);
      expect(root.style.getPropertyValue("--color-ink-tertiary")).toBe(theme.colors.inkTertiary);
      expect(root.style.getPropertyValue("--color-primary")).toBe(theme.colors.primary);
      expect(root.style.getPropertyValue("--color-primary-hover")).toBe(theme.colors.primaryHover);
      expect(root.style.getPropertyValue("--color-primary-focus")).toBe(theme.colors.primaryFocus);
      expect(root.style.getPropertyValue("--color-brand-secure")).toBe(theme.colors.brandSecure);
      expect(root.style.getPropertyValue("--color-success")).toBe(theme.colors.success);
      expect(root.style.getPropertyValue("--color-overlay")).toBe(theme.colors.overlay);
    });

    it("setea las CSS vars de fuentes en documentElement", () => {
      const theme = getThemeById("dark")!;
      applyTheme(theme);

      expect(root.style.getPropertyValue("--font-sans")).toBe(theme.fonts.sans.join(", "));
      expect(root.style.getPropertyValue("--font-mono")).toBe(theme.fonts.mono.join(", "));
    });

    it('agrega clase "dark" cuando el tema es dark', () => {
      applyTheme(getThemeById("dark")!);
      expect(root.classList.contains("dark")).toBe(true);
    });

    it('remueve clase "dark" cuando el tema es light', () => {
      root.classList.add("dark");
      applyTheme(getThemeById("light")!);
      expect(root.classList.contains("dark")).toBe(false);
    });
  });
});
