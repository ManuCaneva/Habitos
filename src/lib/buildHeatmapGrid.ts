import type { HabitLog } from '@/schemas/habits'

export interface GridCell {
  date: string
  completed: boolean
  isEmpty: boolean
  count: number
  target: number
}

export const HISTORY_ROWS = 7

export interface BuildGridOptions {
  days: number
  logs: HabitLog[]
  rows?: number
  target?: number
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function buildHeatmapGrid({ days, logs, rows, target }: BuildGridOptions): GridCell[] {
  if (days === 0) return []

  const r = rows ?? HISTORY_ROWS
  const t = target ?? 1
  const countByDate = new Map(logs.map((l) => [l.log_date, l.count]))
  const cols = Math.ceil(days / r)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const realCells: GridCell[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = toLocalDateStr(d)
    const count = countByDate.get(dateStr) ?? 0
    realCells.push({ date: dateStr, completed: count > 0, isEmpty: false, count, target: t })
  }

  const emptyCell: GridCell = { date: '', completed: false, isEmpty: true, count: 0, target: t }
  const totalCells = cols * r
  const padCount = totalCells - days

  const allCells: GridCell[] = []
  for (const cell of realCells) {
    allCells.push(cell)
  }
  for (let p = 0; p < padCount; p++) {
    allCells.push(emptyCell)
  }

  if (import.meta.env.DEV) {
    console.assert(
      allCells.length === cols * r,
      `buildHeatmapGrid: expected ${cols * r} cells, got ${allCells.length}`
    )
  }
  return allCells
}
