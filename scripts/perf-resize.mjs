#!/usr/bin/env node
// =============================================================
// scripts/perf-resize.mjs — Harness de rendimiento del dashboard
//
// Reproduce el jank de resize de ventana y lo mide de forma
// determinista en un navegador plano (sin Tauri):
//   1. Arranca el dev server de Vite (sin Tauri, puerto 1420).
//   2. Inyecta un stub del IPC de Tauri (tests/perf/inject-stub.js)
//      para que la app cargue con datos sintéticos controlados.
//   3. Anima el viewport 800×600 → 1920×1080 en ~1s.
//   4. Inyecta PerformanceObserver('longtask') + gaps de frame +
//      settle time y los imprime como métricas legibles.
//
// Uso:
//   npm run perf:resize
//   npm run perf:resize -- --focus year-calendar   # un widget a la vez
//   npm run perf:resize -- --iterations 3
//
// Budget (calibrado en ticket 06, inicialmente informativo):
//   0 long tasks >50ms · max frame gap <50ms · settle <250ms
// =============================================================

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from '@playwright/test'
import {
  VIEWPORT_START,
  VIEWPORT_END,
  ANIM_MS,
  STEPS,
  BUDGET,
} from '../tests/perf/perf-constants.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STUB_PATH = path.join(ROOT, 'tests', 'perf', 'inject-stub.js')
const METRICS_PATH = path.join(ROOT, 'tests', 'perf', 'page-metrics.js')
const APP_URL = 'http://localhost:1420'

const args = process.argv.slice(2)
const parseArg = (name, def) => {
  const i = args.indexOf(name)
  return i === -1 ? def : args[i + 1]
}

const FOCUS = parseArg('--focus', null)
const ITERATIONS = Number(parseArg('--iterations', '1')) || 1

function buildParams() {
  return {
    ...(FOCUS ? { perfFocus: FOCUS } : {}),
  }
}

async function isServerUp() {
  try {
    const res = await fetch(`${APP_URL}/`)
    return res.ok
  } catch {
    return false
  }
}

function startVite() {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['vite', '--port', '1420', '--strictPort'], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let out = ''
    child.stdout.on('data', (d) => {
      out += d.toString()
      if (out.includes('Local:')) resolve(child)
    })
    child.stderr.on('data', (d) => process.stderr.write(d))
    child.on('error', reject)
    child.on('exit', (code) => {
      if (!out.includes('Local:')) reject(new Error(`vite exit code ${code}`))
    })
  })
}

async function collectSettle(page) {
  return await page.evaluate(async () => {
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

async function runIteration(browser) {
  const page = await browser.newPage({
    viewport: VIEWPORT_START,
    deviceScaleFactor: 1,
  })

  await page.addInitScript(
    ({ stubSrc, metricsSrc, params }) => {
      window.__perfParams = params
      const stub = new Function(stubSrc)
      stub.call(window)
      const metrics = new Function(metricsSrc)
      metrics.call(window)
    },
    {
      stubSrc: readFileSync(STUB_PATH, 'utf8'),
      metricsSrc: readFileSync(METRICS_PATH, 'utf8'),
      params: buildParams(),
    }
  )

  const url = `${APP_URL}/?perf=1`
  await page.goto(url, { waitUntil: 'load' })

  // Espera a que el dashboard esté montado y los stores cargados.
  await page.waitForSelector('[data-testid="dashboard-view"]', { timeout: 15000 })
  await page.waitForFunction(
    () =>
      window.__TAURI_INTERNALS__?.__aeonStubReady &&
      document.querySelector('[data-testid="dashboard-view"]') !== null,
    undefined,
    { timeout: 15000 }
  )

  // Deja que Vue asiente el primer render.
  await page.waitForTimeout(400)

  // Marca t0 y arranca la medición (long tasks + frames).
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

  const result = await collectSettle(page)
  await page.close()
  return result
}

function printResult(result, iteration) {
  const label = FOCUS ? `focus=${FOCUS}` : 'full dashboard'
  const longTasks = result.longTasks.length
  const red = '\x1b[31m'
  const green = '\x1b[32m'
  const reset = '\x1b[0m'

  const ok =
    longTasks <= BUDGET.maxLongTasks &&
    result.maxFrameGap < BUDGET.maxFrameGapMs &&
    result.settleMs < BUDGET.settleMs

  const color = ok ? green : red
  const status = ok ? 'OK (verde)' : 'JANK (rojo)'

  console.log(`\n[iteración ${iteration}] ${label}`)
  console.log(`  long tasks (>50ms): ${longTasks}`)
  for (const lt of result.longTasks) {
    console.log(`    - ${lt.duration.toFixed(1)}ms @ ${lt.startTime.toFixed(0)}ms`)
  }
  console.log(`  max frame gap:      ${result.maxFrameGap.toFixed(1)}ms`)
  console.log(`  settle time:        ${result.settleMs}ms`)
  console.log(`  frames pintados:    ${result.frameCount}`)
  console.log(`  ${color}${status}${reset}`)
}

async function main() {
  let vite = null
  if (!(await isServerUp())) {
    vite = await startVite()
  }
  const browser = await chromium.launch()
  try {
    for (let i = 1; i <= ITERATIONS; i++) {
      const result = await runIteration(browser)
      printResult(result, i)
    }
  } finally {
    await browser.close()
    if (vite) vite.kill()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
