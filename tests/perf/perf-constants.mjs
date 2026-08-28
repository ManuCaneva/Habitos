// =============================================================
// tests/perf/perf-constants.mjs
//
// Constantes compartidas entre el driver de diagnóstico
// (scripts/perf-resize.mjs) y el test de CI (tests/perf/perf.spec.ts).
//
// El budget vive acá a propósito: cuando el ticket 06 lo calibre,
// solo se toca este archivo. Contra el código actual (0c21aa0) la
// baseline es ROJA; estos valores son informativos hasta ese ticket.
// =============================================================

export const VIEWPORT_START = { width: 800, height: 600 }
export const VIEWPORT_END = { width: 1920, height: 1080 }
export const ANIM_MS = 1000
export const STEPS = 20

export const BUDGET = {
  maxLongTasks: 0, // long tasks >50ms permitidos
  maxFrameGapMs: 50,
  settleMs: 250,
}
