import { COLS, ROWS } from '@/lib/grid'

export interface SnapOptions {
  minW?: number
  minH?: number
}

/**
 * Convierte píxeles (left/top/width/height relativos al contenedor) a celdas
 * enteras de la grilla COLS×ROWS. Redondea px / cell a la celda más cercana
 * y clampa para que el item no se salga del contenedor.
 */
export function pxToCells(
  leftPx: number,
  topPx: number,
  widthPx: number,
  heightPx: number,
  containerWidth: number,
  containerHeight: number,
  opts?: SnapOptions
): { x: number; y: number; w: number; h: number } {
  const colWidth = containerWidth / COLS
  const rowHeight = containerHeight / ROWS
  const minW = opts?.minW ?? 1
  const minH = opts?.minH ?? 1

  let w = Math.max(minW, Math.round(widthPx / colWidth))
  let h = Math.max(minH, Math.round(heightPx / rowHeight))
  w = Math.min(w, COLS)
  h = Math.min(h, ROWS)

  let x = Math.max(0, Math.round(leftPx / colWidth))
  let y = Math.max(0, Math.round(topPx / rowHeight))
  x = Math.min(x, COLS - w)
  y = Math.min(y, ROWS - h)

  return { x, y, w, h }
}
