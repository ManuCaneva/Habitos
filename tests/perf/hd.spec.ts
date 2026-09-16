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
})
