const RAW_PALETTE_PATTERN =
  /\b(?:text|bg|border|from|to|via|ring|fill|stroke|shadow|decoration|outline|divide|placeholder)-(?:red|green|blue|yellow|orange|purple|pink|gray|grey|zinc|slate|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\d{2,3}\b/

export function hasRawPaletteColor(html: string): boolean {
  return RAW_PALETTE_PATTERN.test(html)
}
