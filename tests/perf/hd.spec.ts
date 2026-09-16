import { test, expect } from '@playwright/test'
import { injectStub, waitForDashboard } from './harness'

const HD = { width: 1280, height: 720 }

// Layout real por defecto del store (goals w12 h3 en y4), el que reproducía
// el corte vertical en HD. La grilla del stub no solapa year-calendar para
// aislar el comportamiento del widget de objetivos.
const DEFAULT_REAL_LAYOUT = [
  { i: 'habits', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
  { i: 'tasks', x: 6, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
  { i: 'goals', x: 0, y: 4, w: 12, h: 3, minW: 1, minH: 1 },
  { i: 'year-calendar', x: 0, y: 7, w: 12, h: 3, minW: 1, minH: 3 },
]

async function openDashboard(
  page: import('@playwright/test').Page,
  layout: Record<string, unknown>[]
) {
  await page.setViewportSize(HD)
  await injectStub(page, { perfLayout: encodeURIComponent(JSON.stringify(layout)) })
  await page.goto('/?perf=1', { waitUntil: 'load' })
  await waitForDashboard(page)
  await page.waitForTimeout(400)
}

test.describe('HD (1280×720)', () => {
  test('el botón de incrementar progreso queda dentro del área visible del widget', async ({
    page,
  }) => {
    await openDashboard(page, DEFAULT_REAL_LAYOUT)

    const button = page.locator('[data-testid="goal-increment-button"]').first()
    await expect(button).toBeVisible()

    const hit = await button.evaluate((el) => {
      const r = el.getBoundingClientRect()
      const target = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
      return {
        centerOnButton: target !== null && (el === target || el.contains(target)),
        rect: { top: r.top, bottom: r.bottom, left: r.left, right: r.right },
      }
    })

    // El centro del botón no está recortado por ningún ancestro con overflow.
    expect(hit.centerOnButton, 'centro del botón visible sin recorte').toBe(true)

    const widget = await page.locator('[data-testid="goals-widget"]').boundingBox()
    expect(widget, 'widget de objetivos renderizado').not.toBeNull()
    expect(hit.rect.top).toBeGreaterThanOrEqual(widget!.y - 1)
    expect(hit.rect.bottom).toBeLessThanOrEqual(widget!.y + widget!.height + 1)
    expect(hit.rect.left).toBeGreaterThanOrEqual(widget!.x - 1)
    expect(hit.rect.right).toBeLessThanOrEqual(widget!.x + widget!.width + 1)
  })

  test('el widget no desborda horizontalmente el panel ni su cuerpo', async ({ page }) => {
    const layout = [
      { i: 'habits', x: 1, y: 0, w: 11, h: 10, minW: 1, minH: 1 },
      { i: 'goals', x: 0, y: 0, w: 1, h: 10, minW: 1, minH: 1 },
    ]
    await openDashboard(page, layout)

    const gridOverflow = await page
      .locator('.dashboard-grid')
      .evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(gridOverflow, 'la grilla no desborda el panel').toBeLessThanOrEqual(1)

    const widget = page.locator('[data-testid="goals-widget"]')
    const bodyOverflow = await widget
      .locator('.entity-body-responsive')
      .evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(bodyOverflow, 'el contenido del widget no desborda su cuerpo').toBeLessThanOrEqual(1)

    const wb = await widget.boundingBox()
    const button = await widget
      .locator('[data-testid="goal-increment-button"]')
      .first()
      .boundingBox()
    expect(wb, 'widget de objetivos renderizado').not.toBeNull()
    expect(button, 'botón de incrementar renderizado').not.toBeNull()
    expect(button!.x + button!.width).toBeLessThanOrEqual(wb!.x + wb!.width + 1)
    expect(wb!.x + wb!.width).toBeLessThanOrEqual(HD.width + 1)
  })

  test('respeta el layout persistido del usuario sin resetearlo', async ({ page }) => {
    const layout = [
      { i: 'habits', x: 0, y: 0, w: 6, h: 3, minW: 1, minH: 1 },
      { i: 'tasks', x: 6, y: 0, w: 6, h: 3, minW: 1, minH: 1 },
      { i: 'goals', x: 1, y: 3, w: 10, h: 4, minW: 1, minH: 1 },
      { i: 'year-calendar', x: 0, y: 7, w: 12, h: 3, minW: 1, minH: 3 },
    ]
    await openDashboard(page, layout)

    const item = page.locator('.grid-item:has([data-testid="goals-widget"])')
    await expect(item).toHaveAttribute('style', /grid-area:\s*4 \/ 2 \/ span 4 \/ span 10/)

    // El layout sembrado en config sigue intacto: el fix no lo resetea ni reescribe.
    const persisted = await page.evaluate(async () => {
      const raw = await window.__TAURI_INTERNALS__.invoke('load_config', {
        key: 'aeon-dashboard-layout',
      })
      return JSON.parse(raw as string) as {
        i: string
        x: number
        y: number
        w: number
        h: number
      }[]
    })
    expect(persisted).toEqual(layout)
  })

  test('la cruz de quitar widget sobresale del widget sin recortarse y queda encima del vecino', async ({
    page,
  }) => {
    const layout = [
      { i: 'habits', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
      { i: 'tasks', x: 6, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
      { i: 'goals', x: 0, y: 4, w: 12, h: 3, minW: 1, minH: 1 },
    ]
    await openDashboard(page, layout)
    await page.click('[data-testid="nav-edit-mode"]')
    await page.waitForSelector('.grid-item--editable')

    const cross = page.locator(
      '.grid-item:has([data-testid="habits-widget"]) [data-testid="widget-remove-button"]'
    )
    const item = page.locator('.grid-item:has([data-testid="habits-widget"])')
    const crossBox = await cross.boundingBox()
    const itemBox = await item.boundingBox()
    expect(crossBox, 'cruz renderizada').not.toBeNull()
    expect(itemBox, 'widget renderizado').not.toBeNull()

    // Sobresale por arriba a la derecha (offset hacia afuera).
    expect(crossBox!.y).toBeLessThan(itemBox!.y)
    expect(crossBox!.x + crossBox!.width).toBeGreaterThan(itemBox!.x + itemBox!.width)

    const hit = await cross.evaluate((el) => {
      const r = el.getBoundingClientRect()
      const targets = {
        center: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2),
        topOverhang: document.elementFromPoint(r.left + r.width / 2, r.top + 2),
        rightOverhang: document.elementFromPoint(r.right - 2, r.top + r.height / 2),
      }
      const owns = (target: Element | null) =>
        target !== null && (el === target || el.contains(target))
      const style = getComputedStyle(el)
      return {
        centerOwned: owns(targets.center),
        topOverhangOwned: owns(targets.topOverhang),
        rightOverhangOwned: owns(targets.rightOverhang),
        borderTopWidth: style.borderTopWidth,
        backgroundColor: style.backgroundColor,
      }
    })

    // Sin recorte en la zona que sobresale del widget.
    expect(hit.centerOwned, 'centro de la cruz sin recorte').toBe(true)
    expect(hit.topOverhangOwned, 'overhang superior sin recorte').toBe(true)
    expect(hit.rightOverhangOwned, 'overhang derecho sin recorte (sobre el vecino)').toBe(true)

    // Contorno y fondo propios.
    expect(parseFloat(hit.borderTopWidth)).toBeGreaterThan(0)
    expect(hit.backgroundColor).not.toBe('rgba(0, 0, 0, 0)')

    // Quita el widget correcto: solo desaparece hábitos, tareas queda.
    await cross.click()
    await expect(page.locator('[data-testid="habits-widget"]')).toHaveCount(0)
    await expect(page.locator('[data-testid="tasks-widget"]')).toHaveCount(1)
  })

  test('la cruz de un widget pegado al borde derecho no se recorta contra la vista', async ({
    page,
  }) => {
    const layout = [
      { i: 'habits', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
      { i: 'tasks', x: 6, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
      { i: 'goals', x: 0, y: 4, w: 12, h: 3, minW: 1, minH: 1 },
    ]
    await openDashboard(page, layout)
    await page.click('[data-testid="nav-edit-mode"]')
    await page.waitForSelector('.grid-item--editable')

    // tasks ocupa la última columna: su cruz desborda sobre el aire de la
    // vista (p-3), fuera de la grilla pero dentro del root con overflow-hidden.
    const probe = await page.evaluate(() => {
      const grid = document.querySelector('.dashboard-grid') as HTMLElement
      const gridRect = grid.getBoundingClientRect()
      const cross = document.querySelector(
        '.grid-item:has([data-testid="tasks-widget"]) [data-testid="widget-remove-button"]'
      ) as HTMLElement
      const r = cross.getBoundingClientRect()
      const rightOverhang = document.elementFromPoint(r.right - 2, r.top + r.height / 2)
      const topOverhang = document.elementFromPoint(r.left + r.width / 2, r.top + 2)
      return {
        rightOverhangOwned:
          rightOverhang !== null && (rightOverhang === cross || cross.contains(rightOverhang)),
        topOverhangOwned:
          topOverhang !== null && (topOverhang === cross || cross.contains(topOverhang)),
        beyondGrid: r.right > gridRect.right,
      }
    })

    // El overhang derecho cae fuera de la grilla (sobre el padding de la vista)
    // y sigue siendo de la cruz: no lo recorta el overflow-hidden del root.
    expect(probe.beyondGrid, 'la cruz desborda el borde derecho de la grilla').toBe(true)
    expect(probe.rightOverhangOwned, 'overhang derecho visible y hitteable').toBe(true)
    expect(probe.topOverhangOwned, 'overhang superior visible y hitteable').toBe(true)
  })

  test('la cruz de goals se apila por encima del widget vecino que invade hacia arriba', async ({
    page,
  }) => {
    const layout = [
      { i: 'habits', x: 0, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
      { i: 'tasks', x: 6, y: 0, w: 6, h: 4, minW: 1, minH: 1 },
      { i: 'goals', x: 0, y: 4, w: 12, h: 3, minW: 1, minH: 1 },
    ]
    await openDashboard(page, layout)
    await page.click('[data-testid="nav-edit-mode"]')
    await page.waitForSelector('.grid-item--editable')

    // La cruz de goals (fila 4) sobresale hacia arriba sobre la fila 3, que
    // ocupa tasks: debe quedar pintada por encima y ganar el hit-test.
    const probe = await page.evaluate(() => {
      const cross = document.querySelector(
        '.grid-item:has([data-testid="goals-widget"]) [data-testid="widget-remove-button"]'
      ) as HTMLElement
      const tasks = document.querySelector(
        '.grid-item:has([data-testid="tasks-widget"])'
      ) as HTMLElement
      const r = cross.getBoundingClientRect()
      const tasksRect = tasks.getBoundingClientRect()
      const topOverhang = document.elementFromPoint(r.left + r.width / 2, r.top + 2)
      return {
        overhangInsideNeighbor: r.top + 2 < tasksRect.bottom && r.top + 2 > tasksRect.top,
        topOverhangOwned:
          topOverhang !== null && (topOverhang === cross || cross.contains(topOverhang)),
        crossZ: Number(getComputedStyle(cross.parentElement as Element).zIndex),
        tasksZ: Number(getComputedStyle(tasks).zIndex),
      }
    })

    expect(probe.overhangInsideNeighbor, 'el overhang cae dentro del vecino de arriba').toBe(true)
    expect(probe.topOverhangOwned, 'la cruz gana el hit-test sobre el vecino').toBe(true)
    expect(probe.crossZ, 'el item de goals apila por encima del de tasks').toBeGreaterThan(
      probe.tasksZ
    )
  })
})
