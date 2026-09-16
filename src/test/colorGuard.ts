const RAW_PALETTE_PATTERN =
  /\b(?:text|bg|border|from|to|via|ring|ring-offset|fill|stroke|shadow|decoration|outline|divide|placeholder)-(?:(?:red|green|blue|yellow|orange|purple|pink|gray|grey|zinc|slate|neutral|stone|amber|lime|emerald|teal|cyan|sky|indigo|violet|fuchsia|rose)-\d{2,3}|white|black)\b/

const HARDCODED_HEX_PATTERN = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/
const NUMERIC_RGB_PATTERN = /\brgba?\(\s*\d/

export function hasRawPaletteColor(html: string): boolean {
  return RAW_PALETTE_PATTERN.test(html)
}

export function hasHardcodedColor(value: string): boolean {
  return (
    RAW_PALETTE_PATTERN.test(value) ||
    HARDCODED_HEX_PATTERN.test(value) ||
    NUMERIC_RGB_PATTERN.test(value)
  )
}
