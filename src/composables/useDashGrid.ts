import { ref, onMounted, onUnmounted, type Ref } from "vue";

export interface GridDimensions {
  colWidth: number;
  rowHeight: number;
  marginX: number;
  marginY: number;
  containerWidth: number;
}

const ROW_HEIGHT = 80;
const MARGIN_X = 12;
const MARGIN_Y = 12;
const COLS = 12;

export function useDashGrid(containerRef: Ref<HTMLElement | null>) {
  const dims = ref<GridDimensions>({
    colWidth: 100,
    rowHeight: ROW_HEIGHT,
    marginX: MARGIN_X,
    marginY: MARGIN_Y,
    containerWidth: 1200,
  });

  let observer: ResizeObserver | null = null;

  function recalc() {
    const el = containerRef.value;
    if (!el) return;
    const w = el.clientWidth;
    const colWidth = (w - MARGIN_X * (COLS - 1)) / COLS;
    dims.value = {
      colWidth,
      rowHeight: ROW_HEIGHT,
      marginX: MARGIN_X,
      marginY: MARGIN_Y,
      containerWidth: w,
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

  function gridToPixel(x: number, y: number, w: number, h: number) {
    const { colWidth, rowHeight, marginX, marginY } = dims.value;
    return {
      left: x * (colWidth + marginX),
      top: y * (rowHeight + marginY),
      width: w * colWidth + (w - 1) * marginX,
      height: h * rowHeight + (h - 1) * marginY,
    };
  }

  function snapToGrid(px: number, py: number, pw: number, ph: number) {
    const { colWidth, rowHeight, marginX, marginY } = dims.value;
    const cellW = colWidth + marginX;
    const cellH = rowHeight + marginY;
    return {
      x: Math.max(0, Math.round(px / cellW)),
      y: Math.max(0, Math.round(py / cellH)),
      w: Math.max(1, Math.round((pw + marginX) / cellW)),
      h: Math.max(1, Math.round((ph + marginY) / cellH)),
    };
  }

  return { dims, gridToPixel, snapToGrid };
}
