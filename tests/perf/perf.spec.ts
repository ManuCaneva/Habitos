import { test, expect } from '@playwright/test'
import { injectStub, waitForDashboard } from './harness'
import { VIEWPORT_START, VIEWPORT_END, ANIM_MS, STEPS, BUDGET } from './perf-constants.mjs'

async function runResizeAnimation(page: import('@playwright/test').Page) {
  await page.goto('/?perf=1', { waitUntil: 'load' })
  await waitForDashboard(page)
  await page.waitForTimeout(400)

  await page.evaluate(() => {
    window.__perfT0 = performance.now()
    window.__perfMetrics.start()
  })

  await page.setViewportSize(VIEWPORT_START)
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS
    const width = Math.round(VIEWPORT_START.width + (VIEWPORT_END.width - VIEWPORT_START.width) * t)
    const height = Math.round(
      VIEWPORT_START.height + (VIEWPORT_END.height - VIEWPORT_START.height) * t
    )
    await page.setViewportSize({ width, height })
    await page.waitForTimeout(ANIM_MS / STEPS)
  }

  return page.evaluate(async () => {
    window.__perfLastChange = performance.now()
    const settledAt = await window.__perfMetrics.settle()
    const stats = window.__perfMetrics.stats(window.__perfT0, window.__perfLastChange)
    return {
      longTasks: stats.longTasks,
      maxFrameGap: stats.maxFrameGap,
      settleMs: Math.round(settledAt - window.__perfLastChange),
      frameCount: stats.frameCount,
    }
  })
}
test('full dashboard resize stays within budget', async ({ page }) => {
  await injectStub(page, {})
  const metrics = await runResizeAnimation(page)

  console.log(
    `\n[perf] full dashboard -> longTasks=${metrics.longTasks.length} maxGap=${metrics.maxFrameGap.toFixed(1)}ms settle=${metrics.settleMs}ms`
  )

  expect(metrics.longTasks.length, 'no long tasks > 50ms durante el resize').toBeLessThanOrEqual(
    BUDGET.maxLongTasks
  )
  expect(metrics.maxFrameGap, 'max frame gap dentro de presupuesto').toBeLessThan(
    BUDGET.maxFrameGapMs
  )
  expect(metrics.settleMs, 'settle dentro de presupuesto').toBeLessThan(BUDGET.settleMs)
})
