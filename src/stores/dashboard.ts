import { defineStore } from 'pinia'
import { shallowRef, markRaw } from 'vue'
import { widgets, getWidgetById } from '@/lib/dashboardWidgets'
import { saveConfig, loadConfig } from '@/lib/db'
import { COLS, ROWS } from '@/lib/grid'

export { COLS, ROWS }

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  static?: boolean
}

export type Layout = LayoutItem[]

/**
 * Detecta si un item (x, y, w, h) en enteros colisiona con cualquier otro
 * item del layout. Retorna true si hay colisión.
 * `ignoreId` permite excluir un item del check (útil al mover/redimensionar).
 */
export function wouldCollide(
  x: number,
  y: number,
  w: number,
  h: number,
  layout: Layout,
  ignoreId?: string
): boolean {
  for (const item of layout) {
    if (ignoreId && item.i === ignoreId) continue
    const overlapX = Math.min(x + w, item.x + item.w) - Math.max(x, item.x)
    const overlapY = Math.min(y + h, item.y + item.h) - Math.max(y, item.y)
    if (overlapX > 0 && overlapY > 0) {
      return true
    }
  }
  return false
}

/**
 * Busca la primera posición libre (x, y) para un item de tamaño (w, h)
 * en una grilla de COLS × ROWS.
 * Retorna null si no hay espacio.
 */
export function findFreePosition(
  w: number,
  h: number,
  layout: Layout
): { x: number; y: number } | null {
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (col + w > COLS) continue
      if (row + h > ROWS) continue
      if (!wouldCollide(col, row, w, h, layout)) {
        return { x: col, y: row }
      }
    }
  }
  return null
}

const STORAGE_KEY = 'aeon-dashboard-layout'
const LEGACY_STORAGE_KEY = 'habitos-dashboard-layout'

function getDefaultLayout(): Layout {
  return widgets.map((widget) =>
    markRaw({
      i: widget.id,
      x: widget.defaultX,
      y: widget.defaultY,
      w: widget.defaultW,
      h: widget.defaultH,
      minW: widget.minW,
      minH: widget.minH,
    })
  )
}

function isIntegerItem(item: unknown): item is LayoutItem {
  if (typeof item !== 'object' || item === null) return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.i === 'string' &&
    obj.i.length > 0 &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number' &&
    typeof obj.w === 'number' &&
    typeof obj.h === 'number'
  )
}

function isPercentItem(item: unknown): item is {
  i: string
  xPercent: number
  yPercent: number
  wPercent: number
  hPercent: number
} {
  if (typeof item !== 'object' || item === null) return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.i === 'string' &&
    obj.i.length > 0 &&
    typeof obj.xPercent === 'number' &&
    typeof obj.yPercent === 'number' &&
    typeof obj.wPercent === 'number' &&
    typeof obj.hPercent === 'number'
  )
}

function isLegacyItem(
  item: unknown
): item is { i: string; x: number; y: number; w: number; h: number } {
  if (typeof item !== 'object' || item === null) return false
  const obj = item as Record<string, unknown>
  return (
    typeof obj.i === 'string' &&
    obj.i.length > 0 &&
    typeof obj.x === 'number' &&
    typeof obj.y === 'number' &&
    typeof obj.w === 'number' &&
    typeof obj.h === 'number'
  )
}

function clamp(x: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, x))
}

function migratePercentToInteger(item: {
  i: string
  xPercent: number
  yPercent: number
  wPercent: number
  hPercent: number
}): LayoutItem {
  const w = clamp(Math.round(item.wPercent * COLS), 1, COLS)
  const h = clamp(Math.round(item.hPercent * ROWS), 1, ROWS)
  const x = clamp(Math.round(item.xPercent * COLS), 0, COLS - w)
  const y = clamp(Math.round(item.yPercent * ROWS), 0, ROWS - h)
  const widget = getWidgetById(item.i)
  return {
    i: item.i,
    x,
    y,
    w,
    h,
    minW: widget?.minW,
    minH: widget?.minH,
  }
}

/**
 * Valida y normaliza un layout persistido. Acepta:
 *  - enteros 12×10 (nuevo formato y legacy pre-branding)
 *  - porcentajes flotantes (formato intermedio) → se migran a enteros
 * Tras el redondeo, si dos items colisionan, se reubica el segundo con
 * findFreePosition manteniendo su tamaño.
 */
function validateLayout(raw: unknown): Layout | null {
  if (!Array.isArray(raw)) return null
  const valid: LayoutItem[] = []
  for (const item of raw) {
    let migrated: LayoutItem | null = null
    if (isIntegerItem(item)) {
      migrated = {
        i: item.i,
        x: clamp(item.x, 0, COLS - 1),
        y: clamp(item.y, 0, ROWS - 1),
        w: clamp(item.w, 1, COLS),
        h: clamp(item.h, 1, ROWS),
        minW: item.minW,
        minH: item.minH,
        maxW: item.maxW,
        maxH: item.maxH,
      }
    } else if (isPercentItem(item)) {
      migrated = migratePercentToInteger(item)
    } else if (isLegacyItem(item)) {
      migrated = {
        i: item.i,
        x: clamp(item.x, 0, COLS - 1),
        y: clamp(item.y, 0, ROWS - 1),
        w: clamp(item.w, 1, COLS),
        h: clamp(item.h, 1, ROWS),
      }
    }
    if (migrated) {
      migrated.x = clamp(migrated.x, 0, COLS - migrated.w)
      migrated.y = clamp(migrated.y, 0, ROWS - migrated.h)
      if (wouldCollide(migrated.x, migrated.y, migrated.w, migrated.h, valid)) {
        const pos = findFreePosition(migrated.w, migrated.h, valid)
        if (pos) {
          migrated.x = pos.x
          migrated.y = pos.y
        }
      }
      valid.push(markRaw(migrated))
    }
  }
  return valid.length > 0 ? valid : null
}

export const useDashboardStore = defineStore('dashboard', () => {
  const layout = shallowRef<Layout>(getDefaultLayout())

  loadConfig(STORAGE_KEY).then((raw) => {
    if (raw !== null) {
      try {
        const parsed = JSON.parse(raw)
        const validated = validateLayout(parsed)
        if (validated) layout.value = validated
        return
      } catch {
        // datos corruptos → fallback
      }
    }
    // Fallback a la clave legada (pre rebranding) para no perder el layout.
    loadConfig(LEGACY_STORAGE_KEY).then((raw) => {
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw)
          const validated = validateLayout(parsed)
          if (validated) layout.value = validated
        } catch {
          // datos corruptos → usar default
        }
      }
    })
  })

  function persist() {
    saveConfig(STORAGE_KEY, JSON.stringify(layout.value)).catch(() => {})
  }

  function updateLayout(newLayout: Layout) {
    layout.value = newLayout.map((item) => markRaw({ ...item }))
    persist()
  }

  function moveTo(id: string, x: number, y: number) {
    const item = layout.value.find((i) => i.i === id)
    if (!item) return
    const clampedX = clamp(x, 0, COLS - item.w)
    const clampedY = clamp(y, 0, ROWS - item.h)
    if (wouldCollide(clampedX, clampedY, item.w, item.h, layout.value, id)) {
      return
    }
    layout.value = layout.value.map((i) =>
      i.i === id ? markRaw({ ...i, x: clampedX, y: clampedY }) : i
    )
    persist()
  }

  function resizeTo(id: string, w: number, h: number) {
    const item = layout.value.find((i) => i.i === id)
    if (!item) return
    const minW = item.minW ?? 1
    const minH = item.minH ?? 1
    const clampedW = clamp(w, minW, COLS - item.x)
    const clampedH = clamp(h, minH, ROWS - item.y)
    if (wouldCollide(item.x, item.y, clampedW, clampedH, layout.value, id)) {
      return
    }
    layout.value = layout.value.map((i) =>
      i.i === id ? markRaw({ ...i, w: clampedW, h: clampedH }) : i
    )
    persist()
  }

  function addWidget(widgetId: string) {
    const widget = getWidgetById(widgetId)
    if (!widget) return
    if (layout.value.some((item) => item.i === widgetId)) return

    const defaultX = widget.defaultX
    const defaultY = widget.defaultY
    const defaultW = widget.defaultW
    const defaultH = widget.defaultH

    let w = defaultW
    let h = defaultH
    let position: { x: number; y: number } | null = null

    if (!wouldCollide(defaultX, defaultY, defaultW, defaultH, layout.value)) {
      position = { x: defaultX, y: defaultY }
    }

    if (!position) {
      position = findFreePosition(defaultW, defaultH, layout.value)
    }

    if (!position) {
      const minW = widget.minW
      const minH = widget.minH
      position = findFreePosition(minW, minH, layout.value)
      if (position) {
        w = minW
        h = minH
        console.warn(`Widget "${widget.title}" colocado a tamaño mínimo (grilla congestionada)`)
      }
    }

    if (!position) {
      console.error(`No se pudo colocar el widget "${widget.title}": no hay espacio en la grilla.`)
      return
    }

    layout.value = [
      ...layout.value,
      markRaw({
        i: widget.id,
        x: position.x,
        y: position.y,
        w,
        h,
        minW: widget.minW,
        minH: widget.minH,
      }),
    ]
    persist()
  }

  function removeWidget(widgetId: string) {
    layout.value = layout.value.filter((item) => item.i !== widgetId)
    persist()
  }

  function resetLayout() {
    layout.value = getDefaultLayout()
    persist()
  }

  return {
    layout,
    updateLayout,
    moveTo,
    resizeTo,
    addWidget,
    removeWidget,
    resetLayout,
  }
})
