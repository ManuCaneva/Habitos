import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDashboardStore, findFreePosition, wouldCollide, COLS, ROWS } from './dashboard'
import { loadConfig, saveConfig } from '@/lib/db'

vi.mock('@/lib/db', () => ({
  loadConfig: vi.fn().mockResolvedValue(null),
  saveConfig: vi.fn().mockResolvedValue(undefined),
}))

function flush() {
  return new Promise((r) => setTimeout(r, 0))
}

describe('dashboard store (grilla entera)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    vi.mocked(loadConfig).mockResolvedValue(null)
  })

  it('carga el layout por defecto en enteros', async () => {
    const store = useDashboardStore()
    await flush()
    expect(store.layout).toHaveLength(5)
    expect(store.layout[0].i).toBe('habits')
    expect(store.layout[0].x).toBe(0)
    expect(store.layout[0].y).toBe(0)
    expect(store.layout[0].w).toBe(6)
    expect(store.layout[0].h).toBe(4)
    expect(store.layout[1].i).toBe('tasks')
    expect(store.layout[2].i).toBe('goals')
    expect(store.layout[3].i).toBe('year-calendar')
    expect(store.layout[4].i).toBe('weekly-schedule')
  })

  it('carga layout guardado válido en enteros', async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([{ i: 'habits', x: 1, y: 0, w: 4, h: 5 }])
    )
    const store = useDashboardStore()
    await flush()
    expect(store.layout).toHaveLength(1)
    expect(store.layout[0].x).toBe(1)
    expect(store.layout[0].w).toBe(4)
  })

  it('migra layout en porcentajes a enteros redondeando a la celda más cercana', async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([{ i: 'habits', xPercent: 0.1, yPercent: 0, wPercent: 0.4, hPercent: 0.5 }])
    )
    const store = useDashboardStore()
    await flush()
    expect(store.layout).toHaveLength(1)
    expect(store.layout[0].x).toBe(1) // round(0.1 * 12)
    expect(store.layout[0].y).toBe(0)
    expect(store.layout[0].w).toBe(5) // round(0.4 * 12)
    expect(store.layout[0].h).toBe(5) // round(0.5 * 10)
  })

  it('restaura minW/minH del registro de widgets al migrar desde porcentajes', async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([
        { i: 'weekly-schedule', xPercent: 0, yPercent: 0.7, wPercent: 1, hPercent: 0.5 },
      ])
    )
    const store = useDashboardStore()
    await flush()
    expect(store.layout[0].minW).toBe(5)
    expect(store.layout[0].minH).toBe(4)
  })

  it('migra layout legacy (enteros 12×10) directamente a enteros', async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([{ i: 'habits', x: 0, y: 0, w: 6, h: 4 }])
    )
    const store = useDashboardStore()
    await flush()
    expect(store.layout).toHaveLength(1)
    expect(store.layout[0].w).toBe(6)
    expect(store.layout[0].h).toBe(4)
  })

  it('clampa items de porcentaje que se salen del contenedor tras el redondeo', async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([{ i: 'a', xPercent: 0.95, yPercent: 0.9, wPercent: 0.2, hPercent: 0.3 }])
    )
    const store = useDashboardStore()
    await flush()
    const a = store.layout[0]
    expect(a.w).toBe(2)
    expect(a.h).toBe(3)
    expect(a.x).toBe(COLS - 2) // clamp a 10
    expect(a.y).toBe(ROWS - 3) // clamp a 7
  })

  it('reubica con findFreePosition los items que colisionan tras el redondeo', async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([
        { i: 'a', xPercent: 0.2, yPercent: 0.2, wPercent: 0.5, hPercent: 0.4 },
        { i: 'b', xPercent: 0.21, yPercent: 0.21, wPercent: 0.5, hPercent: 0.4 },
      ])
    )
    const store = useDashboardStore()
    await flush()
    expect(store.layout).toHaveLength(2)
    const a = store.layout.find((i) => i.i === 'a')!
    const b = store.layout.find((i) => i.i === 'b')!
    expect(a.x).toBe(2)
    expect(a.y).toBe(2)
    expect(wouldCollide(b.x, b.y, b.w, b.h, [a])).toBe(false)
  })

  it('ignora layout inválido y usa default', async () => {
    vi.mocked(loadConfig).mockResolvedValue(JSON.stringify('not-an-array'))
    const store = useDashboardStore()
    await flush()
    expect(store.layout).toHaveLength(5)
    expect(store.layout[0].i).toBe('habits')
  })

  it('filtra items inválidos del layout guardado', async () => {
    vi.mocked(loadConfig).mockResolvedValue(
      JSON.stringify([
        { i: 'habits', x: 0, y: 0, w: 3, h: 3 },
        { i: '', x: 0, y: 0, w: 1, h: 1 },
        { x: 0, y: 0, w: 1, h: 1 },
      ])
    )
    const store = useDashboardStore()
    await flush()
    expect(store.layout).toHaveLength(1)
    expect(store.layout[0].i).toBe('habits')
  })

  it('persiste el layout al actualizar', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 1, y: 0, w: 3, h: 5 }])
    expect(saveConfig).toHaveBeenCalledWith('aeon-dashboard-layout', expect.any(String))
    const call = vi.mocked(saveConfig).mock.calls[0]
    const savedData = JSON.parse(call[1] as string)
    expect(savedData[0].w).toBe(3)
  })

  it('moveTo actualiza posición (enteros) y persiste', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 0, y: 0, w: 3, h: 3 }])
    store.moveTo('habits', 1, 1)
    expect(store.layout[0].x).toBe(1)
    expect(store.layout[0].y).toBe(1)
    const call = vi.mocked(saveConfig).mock.lastCall!
    const savedData = JSON.parse(call[1] as string)
    expect(savedData[0].x).toBe(1)
  })

  it('resizeTo actualiza tamaño (enteros) y persiste', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 0, y: 0, w: 3, h: 3 }])
    store.resizeTo('habits', 4, 4)
    expect(store.layout[0].w).toBe(4)
    expect(store.layout[0].h).toBe(4)
    const call = vi.mocked(saveConfig).mock.lastCall!
    const savedData = JSON.parse(call[1] as string)
    expect(savedData[0].w).toBe(4)
  })

  it('moveTo crea nuevo objeto item (no muta el anterior)', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 0, y: 0, w: 3, h: 3 }])
    const oldItem = store.layout[0]
    store.moveTo('habits', 1, 1)
    const newItem = store.layout[0]
    expect(newItem).not.toBe(oldItem)
    expect(newItem.x).toBe(1)
  })

  it('resizeTo crea nuevo objeto item (no muta el anterior)', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 0, y: 0, w: 3, h: 3 }])
    const oldItem = store.layout[0]
    store.resizeTo('habits', 4, 4)
    const newItem = store.layout[0]
    expect(newItem).not.toBe(oldItem)
    expect(newItem.w).toBe(4)
  })

  it('el item original no se muta tras moveTo', async () => {
    const store = useDashboardStore()
    await flush()
    const oldItem = store.layout[0]
    const oldX = oldItem.x
    store.moveTo('habits', 9, 5)
    expect(oldItem.x).toBe(oldX)
  })

  it('el item original no se muta tras resizeTo', async () => {
    const store = useDashboardStore()
    await flush()
    const oldItem = store.layout[0]
    const oldW = oldItem.w
    store.resizeTo('habits', 9, 7)
    expect(oldItem.w).toBe(oldW)
  })

  it('posiciones por defecto correctas: tasks a la derecha (x=6), goals debajo (y=4)', async () => {
    const store = useDashboardStore()
    await flush()
    const tasks = store.layout.find((i) => i.i === 'tasks')!
    expect(tasks.x).toBe(6)
    expect(tasks.y).toBe(0)
    const goals = store.layout.find((i) => i.i === 'goals')!
    expect(goals.x).toBe(0)
    expect(goals.y).toBe(4)
  })

  it("addWidget('goals') con layout parcial: solo habits", async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 0, y: 0, w: 6, h: 4 }])
    store.addWidget('goals')
    const item = store.layout.find((i) => i.i === 'goals')
    expect(item).toBeDefined()
    expect(item!.x).toBe(0)
    expect(item!.y).toBe(4)
    expect(item!.w).toBe(12)
    expect(item!.h).toBe(3)
  })

  it("addWidget('tasks') con layout parcial: solo habits", async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 0, y: 0, w: 6, h: 4 }])
    store.addWidget('tasks')
    const item = store.layout.find((i) => i.i === 'tasks')
    expect(item).toBeDefined()
    expect(item!.x).toBe(6)
    expect(item!.y).toBe(0)
    expect(item!.w).toBe(6)
    expect(item!.h).toBe(4)
  })

  it('no agrega un widget duplicado', async () => {
    const store = useDashboardStore()
    await flush()
    store.addWidget('habits')
    expect(store.layout).toHaveLength(5)
  })

  it('elimina un widget del layout', async () => {
    const store = useDashboardStore()
    await flush()
    store.removeWidget('habits')
    expect(store.layout).toHaveLength(4)
  })

  it('resetea al layout por defecto', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 4, y: 4, w: 2, h: 2 }])
    store.resetLayout()
    expect(store.layout[0].x).toBe(0)
    expect(store.layout[0].w).toBe(6)
  })

  it('moveTo rechaza solapamiento real pero permite bordes pegados', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([
      { i: 'a', x: 0, y: 0, w: 6, h: 4 },
      { i: 'b', x: 6, y: 0, w: 6, h: 4 },
    ])
    store.moveTo('b', 3, 0)
    const after = store.layout.find((i) => i.i === 'b')!
    expect(after.x).toBe(6)
  })

  it('moveTo permite ubicar widget pegado a otro (bordes tocados)', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([
      { i: 'a', x: 0, y: 0, w: 6, h: 4 },
      { i: 'b', x: 6, y: 4, w: 6, h: 3 },
    ])
    store.moveTo('b', 0, 4)
    const after = store.layout.find((i) => i.i === 'b')!
    expect(after.x).toBe(0)
    expect(after.y).toBe(4)
  })

  it('moveTo clampa la posición para no salirse del contenedor', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'a', x: 0, y: 0, w: 6, h: 4 }])
    store.moveTo('a', 9, 9)
    const after = store.layout.find((i) => i.i === 'a')!
    expect(after.x).toBe(6)
    expect(after.y).toBe(6)
  })

  it('resizeTo rechaza solapamiento real pero permite bordes pegados', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([
      { i: 'a', x: 0, y: 0, w: 3, h: 3 },
      { i: 'b', x: 3, y: 0, w: 3, h: 3 },
    ])
    store.resizeTo('a', 5, 3)
    const after = store.layout.find((i) => i.i === 'a')!
    expect(after.w).toBe(3)
  })

  it('resizeTo clampa tamaño mínimo y máximo', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'a', x: 0, y: 5, w: 4, h: 4 }])
    store.resizeTo('a', 0, 0)
    expect(store.layout[0].w).toBe(1)
    expect(store.layout[0].h).toBe(1)
    store.resizeTo('a', 99, 99)
    expect(store.layout[0].w).toBe(COLS)
    expect(store.layout[0].h).toBe(ROWS - 5)
  })

  it('addWidget busca primera posición libre si default está ocupada', () => {
    const layout: import('./dashboard').Layout = [{ i: 'a', x: 0, y: 0, w: 6, h: 4 }]
    const pos = findFreePosition(6, 4, layout)
    expect(pos).not.toBeNull()
    expect(pos!.x).toBe(6)
    expect(pos!.y).toBe(0)
  })

  it('wouldCollide detecta solapamiento por enteros', () => {
    const layout: import('./dashboard').Layout = [{ i: 'a', x: 0, y: 0, w: 6, h: 5 }]
    expect(wouldCollide(3, 3, 6, 5, layout)).toBe(true)
    expect(wouldCollide(6, 5, 6, 5, layout)).toBe(false)
    expect(wouldCollide(6, 0, 6, 5, layout, 'a')).toBe(false)
  })

  it('wouldCollide no detecta colisión en bordes tocados', () => {
    const layout: import('./dashboard').Layout = [{ i: 'a', x: 0, y: 0, w: 6, h: 4 }]
    expect(wouldCollide(0, 4, 6, 3, layout)).toBe(false)
    expect(wouldCollide(6, 0, 6, 4, layout)).toBe(false)
    expect(wouldCollide(0, 0, 6, 4, layout, 'a')).toBe(false)
  })

  it('addWidget coloca con tamaño mínimo cuando default size no cabe en ningún lado', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'habits', x: 0, y: 0, w: 12, h: 8 }])
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    store.addWidget('goals')
    const item = store.layout.find((i) => i.i === 'goals')
    expect(item).toBeDefined()
    expect(item!.w).toBe(1)
    expect(item!.h).toBe(1)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('addWidget loguea error si la grilla está completamente llena', async () => {
    const store = useDashboardStore()
    await flush()
    store.updateLayout([{ i: 'full', x: 0, y: 0, w: 12, h: 10 }])
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    store.addWidget('habits')
    const item = store.layout.find((i) => i.i === 'habits')
    expect(item).toBeUndefined()
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No se pudo colocar'))
    consoleSpy.mockRestore()
  })
})
