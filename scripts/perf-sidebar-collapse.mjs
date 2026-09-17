#!/usr/bin/env node
// =============================================================
// scripts/perf-sidebar-collapse.mjs — Medición del colapso de sidebar
//
// One-off del issue #71: mide long tasks / frame gaps / settle del
// colapso de la sidebar en el Dashboard, clickeando sidebar-toggle
// (mismo harness que perf-resize: Vite + stub de Tauri + métricas).
//
// Uso:
//   node scripts/perf-sidebar-collapse.mjs
//   node scripts/perf-sidebar-collapse.mjs --iterations 3
// =============================================================

import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { chromium } from '@playwright/test'
import { SIDEBAR_COLLAPSE_REFERENCE } from '../tests/perf/perf-constants.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STUB_PATH = path.join(ROOT, 'tests', 'perf', 'inject-stub.js')
const METRICS_PATH = path.join(ROOT, 'tests', 'perf', 'page-metrics.js')
const APP_URL = 'http://localhost:1420'

const args = process.argv.slice(2)
const ITERATIONS = Math.max(1, Number(args[args.indexOf('--iterations') + 1] ?? '3') || 3)

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

async function runIteration(browser, iteration) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })
  await page.addInitScript(
    ({ stubSrc, metricsSrc }) => {
      const stub = new Function(stubSrc)
      stub.call(window)
      const metrics = new Function(metricsSrc)
      metrics.call(window)
    },
    {
      stubSrc: readFileSync(STUB_PATH, 'utf8'),
      metricsSrc: readFileSync(METRICS_PATH, 'utf8'),
    }
  )

  await page.goto(`${APP_URL}/?perf=1`, { waitUntil: 'load' })
  await page.waitForSelector('[data-testid="dashboard-view"]', { timeout: 15000 })
  await page.waitForFunction(
    () =>
      window.__TAURI_INTERNALS__?.__aeonStubReady &&
      document.querySelector('[data-testid="dashboard-view"]') !== null,
    undefined,
    { timeout: 15000 }
  )
  await page.waitForTimeout(500)

  // Toggle dos veces: colapso + expansión (ambas direcciones de la animación).
  const sample = await page.evaluate(async () => {
    const toggle = document.querySelector('[data-testid="sidebar-toggle"]')
    if (!toggle) throw new Error('sidebar-toggle no encontrado')
    window.__perfT0 = performance.now()
    window.__perfMetrics.start()

    toggle.click()
    await new Promise((r) => setTimeout(r, 400))
    toggle.click()
    await new Promise((r) => setTimeout(r, 400))

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

  const longTasks = sample.longTasks.length
  const red = '\x1b[31m'
  const green = '\x1b[32m'
  const reset = '\x1b[0m'
  const ref = SIDEBAR_COLLAPSE_REFERENCE
  const ok = longTasks <= ref.maxLongTasks && sample.maxFrameGap < ref.maxFrameGapMs
  const color = ok ? green : red
  const status = ok ? 'OK (limpio)' : 'con long tasks'

  console.log(`\n[iteración ${iteration}] colapso+expansión sidebar en dashboard completo`)
  console.log(`  long tasks (>50ms): ${longTasks}`)
  for (const lt of sample.longTasks) {
    console.log(`    - ${lt.duration.toFixed(1)}ms @ ${lt.startTime.toFixed(0)}ms`)
  }
  console.log(`  max frame gap:      ${sample.maxFrameGap.toFixed(1)}ms`)
  console.log(`  settle time:        ${sample.settleMs}ms`)
  console.log(`  frames pintados:    ${sample.frameCount}`)
  console.log(`  ${color}${status}${reset}`)

  await page.close()
  return sample
}

async function main() {
  let vite = null
  if (!(await isServerUp())) {
    vite = await startVite()
  }
  const browser = await chromium.launch()
  try {
    const results = []
    for (let i = 1; i <= ITERATIONS; i++) {
      results.push(await runIteration(browser, i))
    }
    const avg = (k) =>
      results.reduce((a, r) => a + (k === 'longTasks' ? r.longTasks.length : r[k]), 0) /
      results.length
    console.log('\n── resumen ──')
    console.log(`  long tasks promedio: ${avg('longTasks').toFixed(1)}`)
    console.log(`  max frame gap prom.: ${avg('maxFrameGap').toFixed(1)}ms`)
    console.log(`  settle promedio:     ${avg('settleMs').toFixed(0)}ms`)
  } finally {
    await browser.close()
    if (vite) vite.kill()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
