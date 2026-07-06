import { ref, onMounted, onUnmounted, type Ref } from "vue";

export interface GridDimensions {
  colWidth: number;
  rowHeight: number;
  marginX: number;
  marginY: number;
  containerWidth: number;
  containerHeight: number;
  cols: number;
  maxRows: number;
}

const ROW_HEIGHT = 80;
const MARGIN_X = 12;
const MARGIN_Y = 12;
const COLS = 12;
const DEFAULT_MAX_ROWS = 10;

export function snapToGrid(
  leftPx: number,
  topPx: number,
  widthPx: number,
  heightPx: number,
  dims: GridDimensions,
  opts?: { minWPercent?: number; minHPercent?: number },
) {
  const { containerWidth, containerHeight, cols, maxRows } = dims;
  const stepX = 1 / cols;
  const stepY = 1 / maxRows;
  const minWPercent = opts?.minWPercent ?? stepX;
  const minHPercent = opts?.minHPercent ?? stepY;

  let wPercent = Math.max(minWPercent, Math.min(1, widthPx / containerWidth));
  let hPercent = Math.max(minHPercent, Math.min(1, heightPx / containerHeight));
  let xPercent = Math.max(0, Math.min(1 - wPercent, leftPx / containerWidth));
  let yPercent = Math.max(0, Math.min(1 - hPercent, topPx / containerHeight));

  // Clamp: no sale del contenedor
  xPercent = Math.min(xPercent, 1 - wPercent);
  yPercent = Math.min(yPercent, 1 - hPercent);

  // Snap a grilla virtual: múltiplos de stepX (1/cols) y stepY (1/maxRows)
  wPercent = Math.max(minWPercent, Math.round(wPercent / stepX) * stepX);
  hPercent = Math.max(minHPercent, Math.round(hPercent / stepY) * stepY);
  xPercent = Math.round(xPercent / stepX) * stepX;
  yPercent = Math.round(yPercent / stepY) * stepY;

  // Re-clamp después del snap
  xPercent = Math.max(0, Math.min(1 - wPercent, xPercent));
  yPercent = Math.max(0, Math.min(1 - hPercent, yPercent));

  return { xPercent, yPercent, wPercent, hPercent };
}

export function useDashGrid(containerRef: Ref<HTMLElement | null>) {
  const dims = ref<GridDimensions>({
    colWidth: 100,
    rowHeight: ROW_HEIGHT,
    marginX: MARGIN_X,
    marginY: MARGIN_Y,
    containerWidth: 1200,
    containerHeight: 600,
    cols: COLS,
    maxRows: DEFAULT_MAX_ROWS,
  });

  let observer: ResizeObserver | null = null;

  function recalc() {
    const el = containerRef.value;
    if (!el) return;
    const w = el.clientWidth;
    const h = el.clientHeight;
    const colWidth = (w - MARGIN_X * (COLS - 1)) / COLS;
    dims.value = {
      colWidth,
      rowHeight: ROW_HEIGHT,
      marginX: MARGIN_X,
      marginY: MARGIN_Y,
      containerWidth: w,
      containerHeight: h,
      cols: COLS,
      maxRows: DEFAULT_MAX_ROWS,
    };
  }

  onMounted(() => {
    recalc();
    if (containerRef.value) {
      observer = new ResizeObserver(() => recalc());
      observer.observe(containerRef.value);
    }
  });

  onUnmounted(() => {
    observer?.disconnect();
  });

  function gridToPixel(
    xPercent: number,
    yPercent: number,
    wPercent: number,
    hPercent: number,
  ) {
    const { containerWidth, containerHeight } = dims.value;
    return {
      left: xPercent * containerWidth,
      top: yPercent * containerHeight,
      width: wPercent * containerWidth,
      height: hPercent * containerHeight,
    };
  }

  return { dims, gridToPixel, snapToGrid };
}
