// =============================================================
// tests/perf/page-metrics.js
//
// Colector de métricas de rendimiento inyectado en la página.
// Expone window.__perfMetrics:
//   - longTasks: entries de PerformanceObserver('longtask')
//   - frames: timestamps de cada rAF (aprox. frame pintado)
//   - stats(t0, lastChange): long tasks, gaps de frame y settle
//     dentro de la ventana [t0, lastChange + settle]
//
// El settle se mide en el driver: tras el último cambio, se espera
// hasta que la cadencia de frames vuelve a ~60fps (gap <= 24ms).
// =============================================================

;(function installMetrics() {
  const longTasks = []
  const frames = []
  let running = false

  function pushFrame(ts) {
    frames.push(ts)
    if (running) requestAnimationFrame(pushFrame)
  }

  try {
    const po = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTasks.push({ startTime: entry.startTime, duration: entry.duration })
      }
    })
    po.observe({ type: 'longtask', buffered: true })
  } catch (e) {
    console.warn('[page-metrics] PerformanceObserver(longtask) no disponible:', e)
  }

  function start() {
    running = true
    requestAnimationFrame(pushFrame)
  }

  function maxGapBetween(startTime, endTime) {
    let max = 0
    const inWindow = frames.filter((t) => t >= startTime && t <= endTime)
    for (let i = 1; i < inWindow.length; i++) {
      max = Math.max(max, inWindow[i] - inWindow[i - 1])
    }
    return max
  }

  function stats(t0, lastChange) {
    const windowEnd = lastChange
    const longInWindow = longTasks.filter((l) => l.startTime >= t0 && l.startTime <= windowEnd)
    return {
      longTasks: longInWindow.map((l) => ({ startTime: l.startTime, duration: l.duration })),
      maxFrameGap: maxGapBetween(t0, windowEnd),
      frameCount: frames.filter((t) => t >= t0 && t <= windowEnd).length,
    }
  }

  // Espera hasta que la cadencia de frames vuelve a normal tras un cambio.
  // Resuelve cuando hay frames estables consecutivos Y no hubo ningún long
  // task en los últimos 300ms (para no declarar "settle" a mitad de jank).
  function settlePromise() {
    return new Promise((resolve) => {
      let last = -1
      let normalCount = 0
      function step(ts) {
        const gap = last === -1 ? 0 : ts - last
        last = ts
        const lastLongTaskEnd =
          longTasks.length > 0
            ? longTasks[longTasks.length - 1].startTime + longTasks[longTasks.length - 1].duration
            : -Infinity
        const noRecentLongTask = performance.now() - lastLongTaskEnd > 300
        if (gap <= 24 && gap > 0 && noRecentLongTask) {
          normalCount += 1
          if (normalCount >= 5) {
            resolve(performance.now())
            return
          }
        } else {
          normalCount = 0
        }
        requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    })
  }

  window.__perfMetrics = {
    longTasks,
    frames,
    start,
    stats,
    settle: settlePromise,
  }
})()
