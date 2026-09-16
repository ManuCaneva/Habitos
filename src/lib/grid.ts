export const COLS = 12
export const ROWS = 10

/**
 * Orden de apilado de los ítems de la grilla en modo edición: la cruz que
 * sobresale por arriba a la derecha debe quedar pintada por encima de los
 * vecinos que invade. Por eso el z-index crece hacia abajo (y) y hacia la
 * izquierda (COLS - x), y cada celda recibe un valor único y positivo.
 */
export function itemZIndex(x: number, y: number): number {
  return y * COLS + (COLS - x)
}
