// =============================================================
// tests/perf/perf-constants.mjs
//
// Constantes compartidas entre el driver de diagnóstico
// (scripts/perf-resize.mjs) y el test de CI (tests/perf/perf.spec.ts).
//
// El budget vive acá a propósito: la calibración se hace sobre la
// línea base medida con el fixture no solapado (ticket 06) y solo
// se toca este archivo.
//
// Baseline (fixture no solapado, tickets 01-05): 14 long tasks
// >50ms, gap máximo ~233ms, settle ~106ms. El budget agrega
// headroom para correr en CI (máquinas más lentas que dev).
// =============================================================

export const VIEWPORT_START = { width: 800, height: 600 }
export const VIEWPORT_END = { width: 1920, height: 1080 }
export const ANIM_MS = 1000
export const STEPS = 20

export const BUDGET = {
  maxLongTasks: 20, // baseline 13-16 (moda 14) + headroom (~43%)
  maxFrameGapMs: 300, // baseline 216-250ms + headroom (~29%)
  settleMs: 350, // baseline 78-124ms, outliers ~270-283ms
}
