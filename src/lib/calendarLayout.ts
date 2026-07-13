export interface LayoutResult {
  cols: number;
  cellSizePct: number;
  monthWidthPct: number;
  monthHeightPct: number;
  visibleSlots: number;
  showsAll: boolean;
  // Dynamic pixel spacing
  gridGap: number;
  monthPadding: number;
  cellGap: number;
  cellGapX: number;
  cellGapY: number;
  monthHeader: number;
  // Absolute pixels
  cellSize: number;
  monthWidth: number;
  monthHeight: number;
}

// Inner DOM metrics
const MIN_CELL_SIZE = 4;       // minimum readable day cell size in pixels
const MAX_CELL_SIZE = 28;      // maximum day cell size in pixels

export function computeForCols(
  c: number,
  rawW: number,
  rawH: number,
): LayoutResult | null {
  if (rawW <= 0 || rawH <= 0) return null;

  // Subtract container paddings, top-level day-of-week headers height, and a 4px safety margin
  const bodyPadding = 4;
  const colHeaderHeight = rawH < 500 ? 14 : 18;

  const availW = rawW - 2 * bodyPadding;
  const availH = rawH - 2 * bodyPadding - colHeaderHeight - 4;

  if (availW <= 0 || availH <= 0) return null;

  // We define helper functions to calculate spacing relative to the day cell size (cs)
  function getSpacing(cs: number) {
    const cellGap = cs < 10 ? 1 : Math.max(1, Math.round(cs * 0.12));
    const monthPadding = 0;
    const gridGap = cs < 10 ? 4 : Math.max(4, Math.round(cs * 0.4));
    const monthHeader = cs < 10 ? 8 : Math.max(10, Math.round(cs * 0.8));

    // Width of 1 month card
    const monthW = 7 * cs + 6 * cellGap + 2 * monthPadding;
    // Height of 1 month card
    const monthH = 6 * cs + 5 * cellGap + 2 * monthPadding + monthHeader;

    return { cellGap, monthPadding, gridGap, monthHeader, monthW, monthH };
  }

  // First, search for a cell size where target months (6 months) fit
  let bestCs = -1;
  const targetMonths = 6;
  const rowsNeeded = Math.ceil(targetMonths / c);

  for (let cs = MAX_CELL_SIZE; cs >= MIN_CELL_SIZE; cs--) {
    const space = getSpacing(cs);
    const totalW = c * space.monthW + (c - 1) * space.gridGap;
    const totalH = rowsNeeded * space.monthH + (rowsNeeded - 1) * space.gridGap;

    if (totalW <= availW && totalH <= availH) {
      bestCs = cs;
      break;
    }
  }

  // If 6 months cannot fit, vertical constraint is relaxed to just fitting at least 1 row of months
  if (bestCs === -1) {
    for (let cs = MAX_CELL_SIZE; cs >= MIN_CELL_SIZE; cs--) {
      const space = getSpacing(cs);
      const totalW = c * space.monthW + (c - 1) * space.gridGap;
      const totalH = space.monthH; // at least 1 row fits

      if (totalW <= availW && totalH <= availH) {
        bestCs = cs;
        break;
      }
    }
  }

  // If even 1 row cannot fit at the minimum cell size, layout is impossible
  if (bestCs === -1) return null;

  const cs = bestCs;
  const space = getSpacing(cs);

  const rowsFit = Math.max(1, Math.floor((availH + space.gridGap) / (space.monthH + space.gridGap)));
  const visibleSlots = Math.min(12, c * rowsFit);
  const showsAll = visibleSlots >= 12;

  return {
    cols: c,
    cellSizePct: cs / rawW,
    monthWidthPct: space.monthW / rawW,
    monthHeightPct: space.monthH / rawH,
    visibleSlots,
    showsAll,
    gridGap: space.gridGap,
    monthPadding: space.monthPadding,
    cellGap: space.cellGap,
    cellGapX: space.cellGap,
    cellGapY: space.cellGap,
    monthHeader: space.monthHeader,
    cellSize: cs,
    monthWidth: space.monthW,
    monthHeight: space.monthH,
  };
}

export function computeLayout(availW: number, availH: number, targetCols?: number): LayoutResult | null {
  if (availW <= 0 || availH <= 0) return null;

  // If a specific number of columns is requested, enforce it strictly
  if (targetCols !== undefined && targetCols > 0) {
    return computeForCols(targetCols, availW, availH);
  }

  // Determine max columns based on width constraint
  let maxCols = 1;
  if (availW >= 900) {
    maxCols = 4;
  } else if (availW >= 600) {
    maxCols = 3;
  } else if (availW >= 340) {
    maxCols = 2;
  }

  let best: LayoutResult | null = null;

  // Scan columns up to maxCols to find the layout that maximizes month visibility and readability
  for (let c = 1; c <= maxCols; c++) {
    const cand = computeForCols(c, availW, availH);
    if (!cand) continue;

    if (best === null) {
      best = cand;
      continue;
    }

    // 1. Prefer layouts that show all 12 months
    if (cand.showsAll && !best.showsAll) {
      best = cand;
      continue;
    }
    if (!cand.showsAll && best.showsAll) {
      continue;
    }

    // 2. If both show all 12 months, choose the one with the larger day cell size (more readable)
    if (cand.showsAll && best.showsAll) {
      if (cand.cellSizePct > best.cellSizePct) {
        best = cand;
      }
      continue;
    }

    // 3. If neither shows all 12 months, maximize the number of visible months
    if (cand.visibleSlots > best.visibleSlots) {
      best = cand;
    } else if (cand.visibleSlots === best.visibleSlots) {
      // Tie breaker: prefer larger day cells
      if (cand.cellSizePct > best.cellSizePct) {
        best = cand;
      }
    }
  }

  return best;
}
