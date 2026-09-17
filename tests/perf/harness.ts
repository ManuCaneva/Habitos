import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

const DIR = path.dirname(fileURLToPath(import.meta.url))
const STUB = readFileSync(path.join(DIR, 'inject-stub.js'), 'utf8')
const METRICS = readFileSync(path.join(DIR, 'page-metrics.js'), 'utf8')

export async function injectStub(page: Page, params: Record<string, string>) {
  await page.addInitScript(
    ({ stub, metrics, params }) => {
      window.__perfParams = params
      const stubFn = new Function(stub)
      stubFn.call(window)
      const metricsFn = new Function(metrics)
      metricsFn.call(window)
    },
    { stub: STUB, metrics: METRICS, params }
  )
}

export async function waitForDashboard(page: Page) {
  await page.waitForSelector('[data-testid="dashboard-view"]', { timeout: 15000 })
  await page.waitForFunction(
    () =>
      window.__TAURI_INTERNALS__?.__aeonStubReady === true &&
      document.querySelector('[data-testid="dashboard-view"]') !== null,
    undefined,
    { timeout: 15000 }
  )
}
